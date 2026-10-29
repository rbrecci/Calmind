<?php

namespace App\Services;

use App\Models\Bond;
use App\Models\GuardianConsent;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class GuardianConsentService
{
    public function __construct(private ConsentService $consents) {}

    public function create(User $user, int $patientUserId, array $data): GuardianConsent
    {
        $patient = $this->patient($user, $patientUserId);
        $term = $this->consents->current();
        abort_if($term === null, 404);

        return GuardianConsent::create(array_merge($data, [
            'patient_id' => $patient->id,
            'consent_term_id' => $term->id,
            'registered_by_user_id' => $user->id,
        ]))->refresh();
    }

    public function paginate(User $user, int $patientUserId, int $page, int $perPage): LengthAwarePaginator
    {
        $patient = $this->patient($user, $patientUserId);

        return GuardianConsent::where('patient_id', $patient->id)->orderByDesc('id')->paginate($perPage, page: $page);
    }

    private function patient(User $user, int $patientUserId): Patient
    {
        abort_unless($user->psychologist?->approval_status === 'approved', 403);
        $bond = Bond::where('psychologist_id', $user->psychologist->id)->where('status', 'active')
            ->whereHas('patient', fn (Builder $query) => $query->where('user_id', $patientUserId))
            ->with('patient')->firstOrFail();
        if ($bond->patient->birth_date->age >= 18) {
            throw ValidationException::withMessages(['patient' => ['O consentimento do responsável se aplica apenas a pacientes menores de idade.']]);
        }

        return $bond->patient;
    }
}
