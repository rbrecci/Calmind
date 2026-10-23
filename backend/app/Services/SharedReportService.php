<?php

namespace App\Services;

use App\Models\Bond;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\SharedReport;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

// Lado do PSICOLOGO dos relatos. RNF-08, regra inviolavel 1: aqui so se le SharedReport (a view),
// nunca o Model nem a tabela de relatos. A view ja exclui o privado e o despublicado; nao filtre de novo.
class SharedReportService
{
    // RN-20, CA-14.1: vinculo ativo ou encerrado (historico somente leitura). Pendente nao da acesso.
    private const READABLE_BOND_STATUSES = ['active', 'ended'];

    private const MAX_UNSIGNED_INT = 4294967295;

    public function __construct(private AuditService $audit) {}

    // RF-23, CA-23.1, CA-23.2: o total vem da propria view paginada, entao so conta o que o psicologo pode ver
    public function listForPatient(User $psychologistUser, int $patientUserId, int $perPage, int $page): LengthAwarePaginator
    {
        $patient = Patient::where('user_id', $patientUserId)->first();

        // CA-14.2: so os vinculos DESTE psicologo com ESTE paciente; vinculo anterior com outro profissional fica fora
        $bondIds = $patient
            ? $this->readableBonds($psychologistUser)->where('patient_id', $patient->id)->pluck('id')
            : collect();

        $allowed = $bondIds->isNotEmpty();

        // RNF-04, CA-05.2: toda tentativa entra na trilha, e antes de qualquer excecao
        $this->audit->record($psychologistUser->id, 'read_patient_reports', 'patient', $allowed ? 'allowed' : 'denied', $patient?->id, $patient?->id);

        // RN-20: 404 e nao 403, para nao confirmar que existe paciente nem vinculo
        if (! $allowed) {
            throw new NotFoundHttpException;
        }

        return SharedReport::whereIn('bond_id', $bondIds)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage, page: $page);
    }

    // CA-23.5, RN-24: privado, despublicado, inexistente e de paciente sem vinculo dao o MESMO 404.
    // Daqui nao se consulta a tabela de relatos, entao nem seria possivel distinguir; toda negativa vai para a trilha.
    public function find(User $psychologistUser, int $reportId): SharedReport
    {
        $report = SharedReport::whereIn('bond_id', $this->readableBonds($psychologistUser)->select('id'))->find($reportId);

        $this->audit->record(
            $psychologistUser->id,
            'read_report',
            'report',
            $report ? 'allowed' : 'denied',
            $reportId <= self::MAX_UNSIGNED_INT ? $reportId : null,
            $report?->patient_id,
        );

        if (! $report) {
            throw new NotFoundHttpException;
        }

        return $report;
    }

    private function readableBonds(User $psychologistUser): Builder
    {
        return Bond::whereIn('status', self::READABLE_BOND_STATUSES)
            ->whereIn('psychologist_id', Psychologist::select('id')
                ->where('user_id', $psychologistUser->id)
                ->where('approval_status', 'approved'));
    }
}
