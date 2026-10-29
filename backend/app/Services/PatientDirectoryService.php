<?php

namespace App\Services;

use App\Models\Bond;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class PatientDirectoryService
{
    public function profile(User $user): array
    {
        $psychologist = $user->psychologist;

        return [
            'id' => $psychologist?->id,
            'crp' => $psychologist === null ? null : $psychologist->crp_region.'/'.$psychologist->crp_number,
            'approval_status' => $psychologist?->approval_status ?? 'not_submitted',
            'approval_note' => $psychologist?->approval_note,
            'profile_approach' => $psychologist?->profile_approach,
            'profile_specialty' => $psychologist?->profile_specialty,
            'profile_modality' => $psychologist?->profile_modality,
            'profile_region' => $psychologist?->profile_region,
            'profile_bio' => $psychologist?->profile_bio,
            'profile_published_at' => $psychologist?->profile_published_at?->toIso8601String(),
        ];
    }

    public function bonds(User $user, int $page, int $perPage): LengthAwarePaginator
    {
        return Bond::where('patient_id', $user->patient?->id ?? 0)
            ->with('psychologist.user')
            ->withCount(['messages as unread_messages' => fn (Builder $query) => $query->whereNull('read_at')->where('sender_user_id', '!=', $user->id)])
            ->orderByRaw("CASE status WHEN 'active' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END")
            ->orderByDesc('id')->paginate($perPage, page: $page);
    }

    public function requests(User $user, int $page, int $perPage): LengthAwarePaginator
    {
        return $this->psychologistBonds($user)->where('status', 'pending')->with('patient.user')
            ->orderBy('requested_at')->orderBy('id')->paginate($perPage, page: $page);
    }

    public function patients(User $user, string $status, int $page, int $perPage): LengthAwarePaginator
    {
        return $this->psychologistBonds($user)->where('bonds.status', $status)->with('patient.user')
            ->withCount([
                'messages as unread_messages' => fn (Builder $query) => $query->whereNull('read_at')->where('sender_user_id', '!=', $user->id),
                'tasks as overdue_tasks' => fn (Builder $query) => $query->whereNull('archived_at')->whereNull('completed_at')->where('due_date', '<', today()->toDateString()),
            ])
            ->withMin(['appointments as next_appointment_at' => fn (Builder $query) => $query->whereIn('status', ['scheduled', 'rescheduled'])->where('scheduled_at', '>', now())], 'scheduled_at')
            ->orderBy(User::select('name')->join('patients', 'patients.user_id', '=', 'users.id')->whereColumn('patients.id', 'bonds.patient_id')->limit(1))
            ->orderBy('bonds.id')->paginate($perPage, page: $page);
    }

    public function patient(User $user, int $patientUserId): Bond
    {
        return $this->psychologistBonds($user)->whereIn('status', ['active', 'ended'])
            ->whereHas('patient', fn (Builder $query) => $query->where('user_id', $patientUserId))
            ->with('patient.user')->orderByRaw("CASE status WHEN 'active' THEN 0 ELSE 1 END")->orderByDesc('id')->firstOrFail();
    }

    private function psychologistBonds(User $user): Builder
    {
        abort_unless($user->psychologist?->approval_status === 'approved', 403);

        return Bond::where('psychologist_id', $user->psychologist->id);
    }
}
