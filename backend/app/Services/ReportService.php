<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Patient;
use App\Models\Report;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

// Lado do PACIENTE dos relatos. Esta e uma das poucas classes que podem tocar o Model Report;
// o psicologo e o admin passam por SharedReportService (RNF-08, regra inviolavel 1).
class ReportService
{
    // RF-22, DEC-13: sem escolha explicita, o relato nasce compartilhado
    public const DEFAULT_VISIBILITY = 'shared';

    // RNF-12, LGPD art. 11: nada clinico antes do aceite
    private const NO_CONSENT = 'É preciso aceitar o termo de uso antes de registrar relatos.';

    // CA-22.4
    private const NO_BOND = 'É preciso ter um vínculo ativo para registrar relatos.';

    public function create(User $user, string $body, string $visibility): Report
    {
        $patient = $this->patientOf($user);

        $this->assertAcceptedCurrentTerm($user);

        $bond = Bond::where('patient_id', $patient->id)->where('status', 'active')->first();
        if (! $bond) {
            throw new ApiException(409, self::NO_BOND);
        }

        // RNF-02: o cast encrypted do Model cifra o body ao gravar
        $report = Report::create([
            'bond_id' => $bond->id,
            'patient_id' => $patient->id,
            'body' => $body,
            'visibility' => $visibility,
        ]);

        return $this->ownedBy($patient)->findOrFail($report->id);
    }

    // CA-22.2: lista tudo do dono, privados e despublicados inclusive
    public function paginate(User $user, int $perPage, int $page): LengthAwarePaginator
    {
        return $this->ownedBy($this->patientOf($user))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage, page: $page);
    }

    // CA-22.3: a visibilidade nunca muda depois da postagem. Pedir o valor que ja esta e inofensivo.
    public function changeVisibility(User $user, int $id, string $visibility): Report
    {
        $report = $this->findOwned($user, $id);

        if ($report->visibility === $visibility) {
            return $report;
        }

        throw ValidationException::withMessages([
            'visibility' => [$report->visibility === 'private'
                ? 'Um relato privado não pode ser compartilhado depois. Crie um novo relato compartilhado.'
                : 'Para retirar o compartilhamento, use a despublicação.'],
        ]);
    }

    // RF-24, DEC-15, CA-24.1: o relato some da view shared_reports a partir de agora, mas continua do paciente
    public function unpublish(User $user, int $id): Report
    {
        $report = $this->findOwned($user, $id);

        if ($report->visibility === 'private') {
            throw new ApiException(409, 'Este relato é privado e não está compartilhado.');
        }

        // Idempotente: despublicar de novo nao desloca a data da primeira despublicacao
        if ($report->unpublished_at === null) {
            $report->update(['unpublished_at' => now()]);
        }

        return $report;
    }

    // CA-23.5: relato de outro paciente e relato inexistente sao indistinguiveis (404)
    private function findOwned(User $user, int $id): Report
    {
        return $this->ownedBy($this->patientOf($user))->findOrFail($id);
    }

    // CA-24.2: used_in_analysis sai de um EXISTS em analysis_reports, na mesma consulta (sem N+1)
    private function ownedBy(Patient $patient): Builder
    {
        return Report::where('patient_id', $patient->id)->withExists('analyses as used_in_analysis');
    }

    private function patientOf(User $user): Patient
    {
        return $user->patient()->firstOrFail();
    }

    // CA-03.3: vale o aceite nao revogado da versao VIGENTE do termo geral. Termo novo pede novo aceite.
    private function assertAcceptedCurrentTerm(User $user): void
    {
        $term = ConsentTerm::where('type', 'general')
            ->where('effective_from', '<=', now())
            ->orderByDesc('effective_from')
            ->orderByDesc('id')
            ->first();

        $accepted = $term !== null && ConsentAcceptance::where('user_id', $user->id)
            ->where('consent_term_id', $term->id)
            ->whereNull('revoked_at')
            ->exists();

        if (! $accepted) {
            throw new ApiException(403, self::NO_CONSENT);
        }
    }
}
