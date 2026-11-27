<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Bond;
use App\Models\DailyMood;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class MoodService
{
    // RNF-12, LGPD art. 11: humor e dado de saude, entao nada antes do aceite
    private const NO_CONSENT = 'É preciso aceitar o termo de uso antes de registrar seu humor.';

    private const NO_BOND = 'É preciso ter um vínculo ativo para registrar seu humor.';

    public function __construct(private ConsentService $consents, private AuditService $audit) {}

    // So o dia de hoje, no fuso do servidor: o cliente nao escolhe a data, para nao reescrever o passado
    public function markToday(User $user, string $mood): DailyMood
    {
        $patient = $this->patientOf($user);

        if (! $this->consents->hasAccepted($user)) {
            throw new ApiException(403, self::NO_CONSENT);
        }

        $bond = Bond::where('patient_id', $patient->id)->where('status', 'active')->first();
        if (! $bond) {
            throw new ApiException(409, self::NO_BOND);
        }

        return DailyMood::updateOrCreate(
            ['bond_id' => $bond->id, 'mood_date' => today()->toDateString()],
            ['patient_id' => $patient->id, 'mood' => $mood],
        );
    }

    public function paginateOwn(User $user, ?string $from, ?string $to, int $perPage, int $page): LengthAwarePaginator
    {
        return $this->period(DailyMood::where('patient_id', $this->patientOf($user)->id), $from, $to)
            ->paginate($perPage, page: $page);
    }

    // Mesma regra de acesso dos relatos compartilhados: so os vinculos DESTE psicologo, ativos ou
    // encerrados; sem eles, 404 (nao confirma que o paciente existe). Toda tentativa vai para a trilha.
    public function paginateForPatient(User $psychologistUser, int $patientUserId, ?string $from, ?string $to, int $perPage, int $page): LengthAwarePaginator
    {
        $patient = Patient::where('user_id', $patientUserId)->first();

        $bondIds = $patient
            ? Bond::whereIn('status', ['active', 'ended'])
                ->where('patient_id', $patient->id)
                ->whereIn('psychologist_id', Psychologist::select('id')
                    ->where('user_id', $psychologistUser->id)
                    ->where('approval_status', 'approved'))
                ->pluck('id')
            : collect();

        $allowed = $bondIds->isNotEmpty();

        $this->audit->record($psychologistUser->id, 'read_patient_moods', 'patient', $allowed ? 'allowed' : 'denied', $patient?->id, $patient?->id);

        if (! $allowed) {
            throw new NotFoundHttpException;
        }

        return $this->period(DailyMood::whereIn('bond_id', $bondIds), $from, $to)->paginate($perPage, page: $page);
    }

    private function period(Builder $query, ?string $from, ?string $to): Builder
    {
        return $query
            ->when($from, fn (Builder $q) => $q->where('mood_date', '>=', $from))
            ->when($to, fn (Builder $q) => $q->where('mood_date', '<=', $to))
            ->orderByDesc('mood_date')
            ->orderByDesc('id');
    }

    private function patientOf(User $user): Patient
    {
        return $user->patient()->firstOrFail();
    }
}
