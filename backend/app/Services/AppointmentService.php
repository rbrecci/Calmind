<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Appointment;
use App\Models\Bond;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function list(User $user, array $filters): LengthAwarePaginator
    {
        $query = $this->appointments($user);
        if ($user->role === 'psychologist' && isset($filters['bond_id'])) {
            $this->psychologistBond($user, (int) $filters['bond_id']);
            $query->where('bond_id', $filters['bond_id']);
        }

        return $query->when(isset($filters['from']), fn ($q) => $q->whereDate('scheduled_at', '>=', $filters['from']))
            ->when(isset($filters['to']), fn ($q) => $q->whereDate('scheduled_at', '<=', $filters['to']))
            ->orderBy('scheduled_at')->orderBy('id')
            ->paginate($filters['per_page'] ?? 20, page: $filters['page'] ?? 1);
    }

    public function create(User $user, array $data): Appointment
    {
        return DB::transaction(function () use ($user, $data): Appointment {
            $bond = $this->psychologistBond($user, (int) $data['bond_id']);
            $this->assertActive($bond);
            $scheduledAt = Carbon::parse($data['scheduled_at'])->setTimezone(config('app.timezone'));
            $this->assertNoConflict($user, $scheduledAt, (bool) ($data['confirm_conflict'] ?? false));
            $appointment = Appointment::create([
                'bond_id' => $bond->id,
                'scheduled_at' => $scheduledAt,
                'status' => 'scheduled',
                'modality' => $data['modality'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by_user_id' => $user->id,
            ]);
            app(NotificationService::class)->create($bond->patient->user_id, 'appointment.scheduled', $appointment->id);

            return $appointment->refresh()->load(['bond.patient.user', 'bond.psychologist.user']);
        });
    }

    public function update(User $user, int $id, array $data): Appointment
    {
        return DB::transaction(function () use ($user, $id, $data): Appointment {
            $appointment = $this->appointments($user)->lockForUpdate()->findOrFail($id);
            $this->assertActive($appointment->bond);
            if (in_array($appointment->status, ['cancelled', 'done'], true)) {
                throw new ApiException(409, 'Esta consulta não pode ser alterada.');
            }
            $rescheduled = false;
            if (isset($data['scheduled_at'])) {
                $scheduledAt = Carbon::parse($data['scheduled_at'])->setTimezone(config('app.timezone'));
                $this->assertNoConflict($user, $scheduledAt, (bool) ($data['confirm_conflict'] ?? false), $appointment->id);
                $rescheduled = ! $appointment->scheduled_at->equalTo($scheduledAt);
                $data['scheduled_at'] = $scheduledAt;
                if ($rescheduled) {
                    $data['status'] = 'rescheduled';
                }
            }
            unset($data['confirm_conflict']);
            $appointment->update($data);
            if ($rescheduled) {
                app(NotificationService::class)->create($appointment->bond->patient->user_id, 'appointment.rescheduled', $appointment->id);
            }

            return $appointment->refresh();
        });
    }

    public function cancel(User $user, int $id): Appointment
    {
        return DB::transaction(function () use ($user, $id): Appointment {
            $appointment = $this->appointments($user)->lockForUpdate()->findOrFail($id);
            if ($appointment->status === 'done') {
                throw new ApiException(409, 'Uma consulta realizada não pode ser cancelada.');
            }
            if ($appointment->status !== 'cancelled') {
                $appointment->update(['status' => 'cancelled']);
                app(NotificationService::class)->create($appointment->bond->patient->user_id, 'appointment.cancelled', $appointment->id);
            }

            return $appointment->refresh();
        });
    }

    private function appointments(User $user): Builder
    {
        $query = Appointment::with(['bond.patient.user', 'bond.psychologist.user']);
        if ($user->role === 'psychologist') {
            $this->assertApproved($user);

            return $query->whereHas('bond', fn ($bond) => $bond->where('psychologist_id', $user->psychologist->id));
        }

        return $query->whereHas('bond', fn ($bond) => $bond->where('patient_id', $user->patient?->id ?? 0)->whereIn('status', ['active', 'ended']));
    }

    private function psychologistBond(User $user, int $id): Bond
    {
        $this->assertApproved($user);

        return Bond::with('patient')->where('psychologist_id', $user->psychologist->id)->findOrFail($id);
    }

    private function assertApproved(User $user): void
    {
        abort_unless($user->psychologist?->approval_status === 'approved', 403);
    }

    private function assertActive(Bond $bond): void
    {
        if ($bond->status !== 'active') {
            throw new ApiException(409, 'O vínculo não está ativo.');
        }
    }

    private function assertNoConflict(User $user, Carbon $scheduledAt, bool $confirmed, ?int $except = null): void
    {
        $minutes = config('calmind.appointment.conflict_minutes');
        $conflict = $this->appointments($user)->whereIn('status', ['scheduled', 'rescheduled'])
            ->where('scheduled_at', '>', $scheduledAt->copy()->subMinutes($minutes))
            ->where('scheduled_at', '<', $scheduledAt->copy()->addMinutes($minutes))
            ->when($except !== null, fn ($query) => $query->where('id', '!=', $except))->exists();
        if ($conflict && ! $confirmed) {
            throw ValidationException::withMessages(['confirm_conflict' => ['Este horário conflita com outra consulta. Confirme para agendar mesmo assim.']]);
        }
    }
}
