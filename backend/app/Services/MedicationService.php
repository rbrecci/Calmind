<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Bond;
use App\Models\Medication;
use App\Models\MedicationIntake;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

// RF-27, RF-28, RF-29, RF-38, RF-39. DEC-10: a plataforma NAO prescreve nem altera prescricao.
// O psicologo registra medicacao ja prescrita por medico; o paciente confirma, recusa ou suspende.
class MedicationService
{
    public function __construct(private AuditService $audit) {}

    // ---------- psicologo ----------

    // RF-39: situacao de cada registro, com recusa/suspensao e datas. Cada leitura entra na trilha (RF-17).
    public function psychologistList(User $user, ?int $bondId, int $page, int $perPage): LengthAwarePaginator
    {
        $query = $this->psychologistMedications($user);

        if ($bondId !== null) {
            $bond = Bond::query()->where('psychologist_id', $user->psychologist->id)->find($bondId);
            $this->audit->record($user->id, 'read_medications', 'bond', $bond ? 'allowed' : 'denied', $bondId, $bond?->patient_id);
            abort_if($bond === null, 404);
            $query->where('bond_id', $bondId);
        }

        $page = $this->ordered($query)->paginate($perPage, page: $page);
        $this->auditRead($user, $page->getCollection());

        return $page;
    }

    public function psychologistFind(User $user, int $id): Medication
    {
        $medication = $this->psychologistMedications($user)->find($id);
        $this->audit->record($user->id, 'read_medication', 'medication', $medication ? 'allowed' : 'denied', $id, $medication?->bond?->patient_id);
        abort_if($medication === null, 404);

        return $medication;
    }

    // RF-38, CA-38.1: nasce aguardando confirmacao e avisa o paciente. Nenhum lembrete antes da confirmacao.
    public function create(User $user, array $data): Medication
    {
        $this->assertApproved($user);
        $bond = Bond::query()->where('psychologist_id', $user->psychologist->id)->findOrFail((int) $data['bond_id']);

        if ($bond->status !== 'active') {
            throw new ApiException(409, 'O vínculo não está ativo. Não é possível registrar medicação.');
        }

        if (! app(ConsentService::class)->hasAccepted($bond->patient->user)) {
            throw new ApiException(403, 'O paciente precisa aceitar o termo de uso vigente antes de receber registros de medicação.');
        }

        return DB::transaction(function () use ($user, $data, $bond) {
            $medication = Medication::create([
                'bond_id' => $bond->id,
                'name' => $data['name'],
                'dosage' => $data['dosage'] ?? null,
                'prescription_source' => $data['prescription_source'],
                'status' => 'awaiting_confirmation',
                'registered_by_user_id' => $user->id,
            ]);

            foreach ($this->uniqueSlots($data['schedules']) as $slot) {
                $medication->schedules()->create($slot);
            }

            app(NotificationService::class)->create($bond->patient->user_id, 'medication.registered', $medication->id);

            return $medication->refresh()->load("schedules");
        });
    }

    // CA-39.3: suspensao feita pelo paciente nao se reverte pelo psicologo; exige novo registro.
    public function reactivate(User $user, int $id): never
    {
        $medication = $this->psychologistFind($user, $id);

        throw new ApiException(409, $medication->status === 'suspended'
            ? 'Medicação suspensa pelo paciente não pode ser reativada. Registre uma nova medicação em uso para o paciente confirmar.'
            : 'Esta medicação não está suspensa.');
    }

    // ---------- paciente ----------

    public function patientList(User $user, int $page, int $perPage): LengthAwarePaginator
    {
        return $this->ordered($this->patientMedications($user))->paginate($perPage, page: $page);
    }

    public function patientFind(User $user, int $id): Medication
    {
        return $this->patientMedications($user)->findOrFail($id);
    }

    // RF-27, CA-27.1
    public function confirm(User $user, int $id): Medication
    {
        $medication = $this->patientFind($user, $id);
        $this->assertBondActive($medication);

        if ($medication->status !== 'awaiting_confirmation') {
            throw new ApiException(409, 'Esta medicação não está aguardando confirmação.');
        }

        $medication->update(['status' => 'active', 'confirmed_at' => now()]);
        $this->notifyPsychologist($medication, 'medication.confirmed');

        return $medication->refresh()->load('schedules');
    }

    // RF-27, CA-27.3 e CA-27.4: o motivo e obrigatorio e fica visivel ao psicologo
    public function refuse(User $user, int $id, string $reason): Medication
    {
        $medication = $this->patientFind($user, $id);
        $this->assertBondActive($medication);

        if ($medication->status !== 'awaiting_confirmation') {
            throw new ApiException(409, 'Só é possível recusar uma medicação que aguarda confirmação.');
        }

        $medication->update(['status' => 'refused', 'refused_at' => now(), 'refusal_reason' => $reason]);
        $this->notifyPsychologist($medication, 'medication.refused');

        return $medication->refresh()->load('schedules');
    }

    // RF-29: so de ativa para suspensa; suspender de novo mantem o registro original (CA-29.3)
    public function suspend(User $user, int $id): Medication
    {
        $medication = $this->patientFind($user, $id);
        $this->assertBondActive($medication);

        if ($medication->status === 'suspended') {
            throw new ApiException(409, 'Esta medicação já está suspensa.');
        }

        if ($medication->status !== 'active') {
            throw new ApiException(409, 'Só é possível suspender uma medicação ativa.');
        }

        $medication->update(['status' => 'suspended', 'suspended_at' => now(), 'suspended_by_user_id' => $user->id]);
        $this->notifyPsychologist($medication, 'medication.suspended');

        return $medication->refresh()->load('schedules');
    }

    // RF-28: horarios previstos do periodo das medicacoes ativas, com a marcacao quando existe.
    // CA-28.4: ausencia de marcacao significa nao tomada; o sistema nunca presume a tomada.
    public function patientDoses(User $user, Carbon $from, Carbon $to): Collection
    {
        $medications = $this->patientMedications($user)->where('status', 'active')->get();
        $doses = collect();

        foreach ($medications as $medication) {
            $taken = $medication->intakes()->whereBetween('scheduled_for', [$from, $to])->pluck('marked_at', 'scheduled_for')
                ->mapWithKeys(fn ($markedAt, $at) => [Carbon::parse($at)->toDateTimeString() => $markedAt]);

            foreach ($this->slotsBetween($medication, $from, $to) as $slot) {
                $key = $slot->toDateTimeString();
                $doses->push([
                    'medication_id' => $medication->id,
                    'name' => $medication->name,
                    'dosage' => $medication->dosage,
                    'scheduled_for' => $slot->toIso8601String(),
                    'taken' => isset($taken[$key]),
                    'marked_at' => isset($taken[$key]) ? Carbon::parse($taken[$key])->toIso8601String() : null,
                ]);
            }
        }

        return $doses->sortBy('scheduled_for')->values();
    }

    // RF-28, CA-28.2: registra data e hora da marcacao. So vale para horario realmente previsto.
    public function markTaken(User $user, int $id, Carbon $scheduledFor): MedicationIntake
    {
        $medication = $this->patientFind($user, $id);
        $this->assertBondActive($medication);

        if ($medication->status !== 'active') {
            throw new ApiException(409, 'Só é possível marcar a tomada de uma medicação ativa.');
        }

        $isSlot = $medication->schedules->contains(
            fn ($schedule) => $schedule->weekday === $scheduledFor->dayOfWeek
                && substr((string) $schedule->time_of_day, 0, 5) === $scheduledFor->format('H:i'),
        );

        if (! $isSlot || $scheduledFor->isFuture()) {
            throw new ApiException(422, 'Horário inválido para esta medicação.');
        }

        return MedicationIntake::firstOrCreate(
            ['medication_id' => $medication->id, 'scheduled_for' => $scheduledFor->copy()->seconds(0)],
        )->refresh();
    }

    // RF-28, CA-28.1/28.3: usado pelo NotificationService. Devolve [medication_id => horario do ultimo
    // horario previsto de hoje ja vencido e sem marcacao], so para medicacao ativa de vinculo ativo.
    public function dueReminders(Collection $bondIds): Collection
    {
        $now = now();
        $due = collect();

        Medication::query()->where('status', 'active')->whereIn('bond_id', $bondIds)->with('schedules')->get()
            ->each(function (Medication $medication) use ($now, $due): void {
                $latest = $this->slotsBetween($medication, $now->copy()->startOfDay(), $now)->last();

                if ($latest !== null && ! $medication->intakes()->where('scheduled_for', $latest)->exists()) {
                    $due->put($medication->id, $latest);
                }
            });

        return $due;
    }

    // ---------- internos ----------

    private function slotsBetween(Medication $medication, Carbon $from, Carbon $to): Collection
    {
        $slots = collect();

        for ($day = $from->copy()->startOfDay(); $day->lte($to); $day->addDay()) {
            foreach ($medication->schedules->where('weekday', $day->dayOfWeek) as $schedule) {
                $slot = $day->copy()->setTimeFromTimeString((string) $schedule->time_of_day)->seconds(0);

                if ($slot->between($from, $to)) {
                    $slots->push($slot);
                }
            }
        }

        return $slots->sort()->values();
    }

    private function uniqueSlots(array $schedules): array
    {
        return collect($schedules)
            ->map(fn ($slot) => ['weekday' => (int) $slot['weekday'], 'time_of_day' => substr($slot['time_of_day'], 0, 5).':00'])
            ->unique(fn ($slot) => $slot['weekday'].$slot['time_of_day'])->values()->all();
    }

    private function psychologistMedications(User $user): Builder
    {
        $this->assertApproved($user);

        return Medication::query()->with(['schedules', 'bond', 'suspendedBy'])
            ->whereHas('bond', fn (Builder $bond) => $bond->where('psychologist_id', $user->psychologist->id));
    }

    private function patientMedications(User $user): Builder
    {
        return Medication::query()->with(['schedules', 'bond'])
            ->whereHas('bond', fn (Builder $bond) => $bond->where('patient_id', $user->patient?->id ?? 0));
    }

    private function ordered(Builder $query): Builder
    {
        return $query->orderByRaw("CASE status WHEN 'awaiting_confirmation' THEN 0 WHEN 'active' THEN 1 WHEN 'suspended' THEN 2 ELSE 3 END")
            ->orderByDesc('id');
    }

    private function auditRead(User $user, Collection $medications): void
    {
        $medications->each(fn (Medication $medication) => $this->audit->record(
            $user->id, 'read_medication', 'medication', 'allowed', $medication->id, $medication->bond->patient_id,
        ));
    }

    private function notifyPsychologist(Medication $medication, string $type): void
    {
        $medication->loadMissing('bond.psychologist');
        app(NotificationService::class)->create($medication->bond->psychologist->user_id, $type, $medication->id);
    }

    private function assertBondActive(Medication $medication): void
    {
        if ($medication->bond->status !== 'active') {
            throw new ApiException(409, 'O vínculo não está ativo. Esta medicação é somente leitura.');
        }
    }

    private function assertApproved(User $user): void
    {
        abort_unless($user->psychologist?->approval_status === 'approved', 403);
    }
}
