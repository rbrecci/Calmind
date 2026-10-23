<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Psychologist;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    private function bond(): Bond
    {
        $bond = Bond::factory()->active()->create();
        $this->acceptGeneralTerm($bond);

        return $bond;
    }

    private function acceptGeneralTerm(Bond $bond): void
    {
        $term = ConsentTerm::firstOrCreate(['type' => 'general', 'version' => '1.0'], [
            'body' => 'Termo de teste',
            'effective_from' => now()->subDay(),
            'published_by_user_id' => User::factory()->admin()->create()->id,
        ]);
        ConsentAcceptance::create(['user_id' => $bond->patient->user_id, 'consent_term_id' => $term->id]);
    }

    private function task(Bond $bond, array $attributes = []): Task
    {
        return Task::create(array_merge([
            'bond_id' => $bond->id,
            'title' => 'Respirar por cinco minutos',
            'description' => 'Ao fim da tarde',
            'due_date' => now()->addDay()->toDateString(),
            'created_by_user_id' => $bond->psychologist->user_id,
        ], $attributes));
    }

    public function test_psychologist_creates_and_updates_task_only_for_own_active_bond(): void
    {
        $bond = $this->bond();
        $url = '/api/v1/psychologist/tasks';

        $created = $this->as($bond->psychologist->user)->postJson($url, [
            'bond_id' => $bond->id,
            'title' => 'Respirar por cinco minutos',
            'description' => 'Ao fim da tarde',
            'due_date' => now()->addDay()->toDateString(),
        ])->assertCreated();

        $id = $created->json('id');
        $created->assertJsonPath('status', 'pending')
            ->assertJsonPath('bond_id', $bond->id);
        $this->as($bond->psychologist->user)->putJson("{$url}/{$id}", [
            'title' => 'Respirar antes de dormir',
        ])->assertOk()->assertJsonPath('title', 'Respirar antes de dormir');
        $this->assertDatabaseHas('tasks', ['id' => $id, 'title' => 'Respirar antes de dormir']);

        $other = Psychologist::factory()->approved()->create();
        $this->as($other->user)->postJson($url, [
            'bond_id' => $bond->id,
            'title' => 'Invasao',
            'due_date' => now()->addDay()->toDateString(),
        ])->assertNotFound();
        $this->as($other->user)->getJson("{$url}/{$id}")->assertNotFound();
        $this->as($other->user)->putJson("{$url}/{$id}", ['title' => 'Invasao'])->assertNotFound();
    }

    public function test_task_creation_rejects_past_due_date_and_missing_title(): void
    {
        $bond = $this->bond();

        $this->as($bond->psychologist->user)->postJson('/api/v1/psychologist/tasks', [
            'bond_id' => $bond->id,
            'due_date' => now()->subDay()->toDateString(),
        ])->assertUnprocessable()->assertJsonValidationErrors(['title', 'due_date']);
        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_patient_lists_own_tasks_and_completion_is_idempotent(): void
    {
        $bond = $this->bond();
        $task = $this->task($bond);
        $this->task($bond, ['title' => 'Concluida', 'completed_at' => now()->subHour()]);
        $other = $this->task($this->bond());
        $patient = $bond->patient->user;

        $list = $this->as($patient)->getJson('/api/v1/patient/tasks')->assertOk();
        $list->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.id', $task->id)
            ->assertJsonPath('data.0.status', 'pending')
            ->assertJsonPath('data.1.status', 'completed');

        $first = $this->as($patient)->postJson("/api/v1/patient/tasks/{$task->id}/complete")
            ->assertOk()->assertJsonPath('status', 'completed');
        $this->travel(1)->hours();
        $second = $this->as($patient)->postJson("/api/v1/patient/tasks/{$task->id}/complete")
            ->assertOk();
        $this->assertSame($first->json('completed_at'), $second->json('completed_at'));
        $this->as($patient)->getJson("/api/v1/patient/tasks/{$other->id}")->assertNotFound();
        $this->as($patient)->postJson("/api/v1/patient/tasks/{$other->id}/complete")->assertNotFound();
    }

    public function test_ended_bond_is_read_only_and_archived_tasks_are_hidden(): void
    {
        $bond = $this->bond();
        $task = $this->task($bond);
        $psy = $bond->psychologist->user;
        $patient = $bond->patient->user;
        $bond->update(['status' => 'ended', 'ended_at' => now()]);

        $this->as($patient)->getJson("/api/v1/patient/tasks/{$task->id}")->assertOk();
        $this->as($patient)->postJson("/api/v1/patient/tasks/{$task->id}/complete")->assertStatus(409);
        $this->as($psy)->postJson('/api/v1/psychologist/tasks', [
            'bond_id' => $bond->id,
            'title' => 'Nova',
            'due_date' => now()->addDay()->toDateString(),
        ])->assertStatus(409);
        $this->as($psy)->putJson("/api/v1/psychologist/tasks/{$task->id}", ['title' => 'Alterada'])
            ->assertStatus(409);

        $bond->update(['status' => 'active', 'ended_at' => null]);
        $this->as($psy)->deleteJson("/api/v1/psychologist/tasks/{$task->id}")->assertOk();
        $this->assertNotNull($task->fresh()->archived_at);
        $this->as($patient)->getJson('/api/v1/patient/tasks')->assertJsonPath('meta.total', 0);
    }

    public function test_role_and_authentication_gates_all_task_routes(): void
    {
        $bond = $this->bond();
        $task = $this->task($bond);

        $this->getJson('/api/v1/patient/tasks')->assertUnauthorized();
        $this->as($bond->patient->user)->postJson('/api/v1/psychologist/tasks', [])->assertForbidden();
        $this->as($bond->psychologist->user)->postJson("/api/v1/patient/tasks/{$task->id}/complete")
            ->assertForbidden();
    }

    public function test_unapproved_psychologist_cannot_use_tasks_even_with_old_active_bond(): void
    {
        $bond = $this->bond();
        $task = $this->task($bond);
        $psychologist = $bond->psychologist;
        $psychologist->update(['approval_status' => 'rejected']);
        $user = $psychologist->user;

        $this->as($user)->getJson('/api/v1/psychologist/tasks')->assertForbidden();
        $this->as($user)->getJson("/api/v1/psychologist/tasks/{$task->id}")->assertForbidden();
        $this->as($user)->postJson('/api/v1/psychologist/tasks', [
            'bond_id' => $bond->id,
            'title' => 'Invalida',
            'due_date' => now()->addDay()->toDateString(),
        ])->assertForbidden();
        $this->as($user)->putJson("/api/v1/psychologist/tasks/{$task->id}", ['title' => 'Invalida'])
            ->assertForbidden();
        $this->as($user)->deleteJson("/api/v1/psychologist/tasks/{$task->id}")->assertForbidden();
        $this->assertNull($task->fresh()->archived_at);
    }

    public function test_creation_requires_patients_current_general_consent(): void
    {
        $bond = Bond::factory()->active()->create();
        $data = [
            'bond_id' => $bond->id,
            'title' => 'Respirar',
            'due_date' => now()->addDay()->toDateString(),
        ];

        $this->as($bond->psychologist->user)->postJson('/api/v1/psychologist/tasks', $data)->assertForbidden();
        $this->assertDatabaseCount('tasks', 0);

        $this->acceptGeneralTerm($bond);
        ConsentTerm::create([
            'type' => 'general',
            'version' => '2.0',
            'body' => 'Novo termo',
            'effective_from' => now(),
            'published_by_user_id' => User::factory()->admin()->create()->id,
        ]);

        $this->as($bond->psychologist->user)->postJson('/api/v1/psychologist/tasks', $data)->assertForbidden();
        $this->assertDatabaseCount('tasks', 0);
    }
}
