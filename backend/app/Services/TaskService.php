<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class TaskService
{
    public function psychologistList(User $user, ?int $bondId, int $page, int $perPage): LengthAwarePaginator
    {
        $query = $this->psychologistTasks($user);

        if ($bondId !== null) {
            $this->psychologistBond($user, $bondId);
            $query->where('bond_id', $bondId);
        }

        return $this->ordered($query)->paginate($perPage, page: $page);
    }

    public function patientList(User $user, int $page, int $perPage): LengthAwarePaginator
    {
        return $this->ordered($this->patientTasks($user))->paginate($perPage, page: $page);
    }

    public function psychologistFind(User $user, int $id): Task
    {
        return $this->psychologistTasks($user)->findOrFail($id);
    }

    public function patientFind(User $user, int $id): Task
    {
        return $this->patientTasks($user)->findOrFail($id);
    }

    public function create(User $user, array $data): Task
    {
        $bond = $this->psychologistBond($user, (int) $data['bond_id']);
        $this->assertActive($bond);
        $this->assertPatientConsent($bond);

        return Task::create([
            'bond_id' => $bond->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'due_date' => $data['due_date'],
            'created_by_user_id' => $user->id,
        ]);
    }

    public function update(User $user, int $id, array $data): Task
    {
        $task = $this->psychologistFind($user, $id);
        $this->assertActive($task->bond);

        if ($task->completed_at !== null) {
            throw new ApiException(409, 'Uma tarefa concluída não pode ser editada.');
        }

        $task->update($data);

        return $task->refresh();
    }

    public function archive(User $user, int $id): void
    {
        $task = $this->psychologistFind($user, $id);
        $this->assertActive($task->bond);
        $task->update(['archived_at' => now()]);
    }

    public function complete(User $user, int $id): Task
    {
        $task = $this->patientFind($user, $id);
        $this->assertActive($task->bond);

        if ($task->completed_at === null) {
            $task->update(['completed_at' => now()]);
        }

        return $task->refresh();
    }

    private function psychologistBond(User $user, int $id): Bond
    {
        $this->assertApproved($user);

        return Bond::query()->where('psychologist_id', $user->psychologist->id)->findOrFail($id);
    }

    private function psychologistTasks(User $user): Builder
    {
        $this->assertApproved($user);

        return Task::query()->whereNull('archived_at')->whereHas('bond', fn (Builder $bond) => $bond->where('psychologist_id', $user->psychologist->id));
    }

    private function patientTasks(User $user): Builder
    {
        return Task::query()->whereNull('archived_at')->whereHas('bond', fn (Builder $bond) => $bond->where('patient_id', $user->patient?->id ?? 0));
    }

    private function ordered(Builder $query): Builder
    {
        return $query->orderByRaw('completed_at IS NOT NULL')->orderBy('due_date')->orderBy('id');
    }

    private function assertActive(Bond $bond): void
    {
        if ($bond->status !== 'active') {
            throw new ApiException(409, 'O vínculo não está ativo. Esta tarefa é somente leitura.');
        }
    }

    private function assertApproved(User $user): void
    {
        abort_unless($user->psychologist?->approval_status === 'approved', 403);
    }

    private function assertPatientConsent(Bond $bond): void
    {
        $term = ConsentTerm::where('type', 'general')
            ->where('effective_from', '<=', now())
            ->orderByDesc('effective_from')
            ->orderByDesc('id')
            ->first();

        $accepted = $term !== null && ConsentAcceptance::where('user_id', $bond->patient->user_id)
            ->where('consent_term_id', $term->id)
            ->whereNull('revoked_at')
            ->exists();

        if (! $accepted) {
            throw new ApiException(403, 'O paciente precisa aceitar o termo de uso vigente antes de receber tarefas.');
        }
    }
}
