<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Analysis;
use App\Models\AnalysisReport;
use App\Models\AnalysisVersion;
use App\Models\Bond;
use App\Models\SharedReport;
use App\Models\User;
use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\SummaryProvider;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

// RF-41 e RF-42. Tres garantias que este servico existe para manter:
//  1. a IA so roda quando o psicologo pede (RNF-30): nao ha rotina, evento nem agendador que chame request();
//  2. so relato compartilhado chega ao servico de IA: a leitura e sempre pela view shared_reports (RNF-08);
//  3. nada entra no prontuario sem a confirmacao do psicologo (DEC-05).
class AnalysisService
{
    public const LABEL = 'Resumo baseado apenas nos relatos compartilhados pelo paciente. Sugestão gerada por IA: revise antes de confirmar.';

    // CA-42.2: resumo nao confirmado nao fica guardado. Quem abandona a tela perde a sugestao depois deste prazo.
    private const REVIEW_WINDOW_MINUTES = 60;

    private const MAX_PERIOD_DAYS = 31;

    public function __construct(private AuditService $audit, private SummaryProvider $provider) {}

    // RF-41
    public function request(User $user, array $data): Analysis
    {
        $this->expireStale();
        $this->assertApproved($user);

        $bond = Bond::query()->where('psychologist_id', $user->psychologist->id)->find((int) $data['bond_id']);
        $this->audit->record($user->id, 'request_analysis', 'bond', $bond ? 'allowed' : 'denied', $data['bond_id'], $bond?->patient_id);
        abort_if($bond === null, 404);

        if ($bond->status !== 'active') {
            throw new ApiException(409, 'O vínculo não está ativo. Não é possível solicitar análise.');
        }

        $start = Carbon::parse($data['period_start'])->startOfDay();
        $end = Carbon::parse($data['period_end'])->endOfDay();
        if ($start->diffInDays($end) > self::MAX_PERIOD_DAYS) {
            throw new ApiException(422, 'O período da análise pode ter no máximo '.self::MAX_PERIOD_DAYS.' dias.');
        }

        // CA-04.2 e CA-41.4: sem consentimento de IA vigente nada e lido nem enviado
        if (! app(ConsentService::class)->hasAccepted($bond->patient->user, 'ai_analysis')) {
            throw new ApiException(403, 'O paciente não tem consentimento vigente para análise por IA.');
        }

        // RNF-08: so a view, que ja exclui relato privado e despublicado
        $reports = SharedReport::query()->where('bond_id', $bond->id)
            ->whereBetween('created_at', [$start, $end])->orderBy('created_at')->orderBy('id')->get();

        if ($reports->isEmpty()) {
            throw new ApiException(422, 'Não há relatos compartilhados no período para analisar.');
        }

        // minimizacao: sem nome, e-mail ou id do paciente; so a data e o texto
        $payload = $reports->map(fn ($report) => ['date' => $report->created_at->format('Y-m-d'), 'body' => (string) $report->body])->all();

        try {
            $summary = $this->provider->summarize($payload);
        } catch (AiUnavailableException $e) {
            // CA-41.5: falha nao grava resultado parcial. O log leva o motivo tecnico, nunca o conteudo.
            Log::warning('Analise por IA falhou', ['provider' => $this->provider->name(), 'motivo' => $e->getMessage()]);
            throw new ApiException(502, 'O serviço de IA não está disponível agora. Nenhum resultado foi salvo; tente de novo em instantes.');
        }

        return DB::transaction(function () use ($user, $bond, $start, $end, $summary, $reports) {
            $analysis = Analysis::create([
                'bond_id' => $bond->id,
                'requested_by_user_id' => $user->id,
                'period_start' => $start->toDateString(),
                'period_end' => $end->toDateString(),
                'status' => 'generated',
                'summary_raw' => $summary,
            ]);
            foreach ($reports as $report) {
                AnalysisReport::create(['analysis_id' => $analysis->id, 'report_id' => $report->id]);
            }

            return $analysis->refresh()->load('versions');
        });
    }

    // Confirmadas do psicologo; a sugestao ainda nao revisada nao entra na lista (CA-42.2)
    public function list(User $user, ?int $bondId, int $page, int $perPage): LengthAwarePaginator
    {
        $this->expireStale();
        $query = $this->psychologistAnalyses($user)->where('status', 'confirmed');

        if ($bondId !== null) {
            $bond = Bond::query()->where('psychologist_id', $user->psychologist->id)->find($bondId);
            $this->audit->record($user->id, 'read_analyses', 'bond', $bond ? 'allowed' : 'denied', $bondId, $bond?->patient_id);
            abort_if($bond === null, 404);
            $query->where('bond_id', $bondId);
        }

        $page = $query->orderByDesc('id')->paginate($perPage, page: $page);
        $page->getCollection()->each(fn (Analysis $a) => $this->audit->record($user->id, 'read_analysis', 'analysis', 'allowed', $a->id, $a->bond->patient_id));

        return $page;
    }

    public function find(User $user, int $id): Analysis
    {
        $this->expireStale();
        $analysis = $this->psychologistAnalyses($user)->whereIn('status', ['generated', 'confirmed'])->find($id);
        $this->audit->record($user->id, 'read_analysis', 'analysis', $analysis ? 'allowed' : 'denied', $id, $analysis?->bond->patient_id);
        abort_if($analysis === null, 404);

        return $analysis;
    }

    // RF-42, CA-42.1: confirma com ou sem edicao e fixa a primeira versao
    public function confirm(User $user, int $id, ?string $body): Analysis
    {
        $this->expireStale();
        $analysis = $this->psychologistAnalyses($user)->where('status', 'generated')->findOrFail($id);
        $this->assertBondActive($analysis);

        return DB::transaction(function () use ($user, $analysis, $body) {
            AnalysisVersion::create(['analysis_id' => $analysis->id, 'body' => $body ?? $analysis->summary_raw, 'edited_by_user_id' => $user->id]);
            $analysis->update(['status' => 'confirmed', 'confirmed_at' => now(), 'summary_raw' => null]);
            $this->audit->record($user->id, 'confirm_analysis', 'analysis', 'allowed', $analysis->id, $analysis->bond->patient_id);

            return $analysis->refresh()->load('versions');
        });
    }

    // RF-42, CA-42.2: descartar apaga o texto e o vinculo com os relatos usados
    public function discard(User $user, int $id): void
    {
        $this->expireStale();
        $analysis = $this->psychologistAnalyses($user)->where('status', 'generated')->findOrFail($id);

        DB::transaction(function () use ($analysis) {
            AnalysisReport::where('analysis_id', $analysis->id)->delete();
            $analysis->update(['status' => 'discarded', 'summary_raw' => null]);
        });
        $this->audit->record($user->id, 'discard_analysis', 'analysis', 'allowed', $analysis->id, $analysis->bond->patient_id);
    }

    // RF-42, CA-42.4: edicao depois de confirmar cria uma versao nova e preserva as anteriores
    public function edit(User $user, int $id, string $body): Analysis
    {
        $analysis = $this->psychologistAnalyses($user)->where('status', 'confirmed')->findOrFail($id);
        $this->assertBondActive($analysis);

        AnalysisVersion::create(['analysis_id' => $analysis->id, 'body' => $body, 'edited_by_user_id' => $user->id]);
        $this->audit->record($user->id, 'edit_analysis', 'analysis', 'allowed', $analysis->id, $analysis->bond->patient_id);

        return $analysis->refresh()->load('versions');
    }

    // CA-42.2: sugestao parada alem do prazo e descartada de verdade, sem agendador: roda a cada chamada
    private function expireStale(): void
    {
        $stale = Analysis::query()->where('status', 'generated')->where('requested_at', '<', now()->subMinutes(self::REVIEW_WINDOW_MINUTES))->pluck('id');
        if ($stale->isEmpty()) {
            return;
        }

        DB::transaction(function () use ($stale) {
            AnalysisReport::whereIn('analysis_id', $stale)->delete();
            Analysis::whereIn('id', $stale)->update(['status' => 'discarded', 'summary_raw' => null]);
        });
    }

    private function psychologistAnalyses(User $user): Builder
    {
        $this->assertApproved($user);

        return Analysis::query()->with(['versions', 'bond'])
            ->whereHas('bond', fn (Builder $bond) => $bond->where('psychologist_id', $user->psychologist->id));
    }

    private function assertBondActive(Analysis $analysis): void
    {
        if ($analysis->bond->status !== 'active') {
            throw new ApiException(409, 'O vínculo não está ativo. Esta análise é somente leitura.');
        }
    }

    private function assertApproved(User $user): void
    {
        abort_unless($user->psychologist?->approval_status === 'approved', 403);
    }
}
