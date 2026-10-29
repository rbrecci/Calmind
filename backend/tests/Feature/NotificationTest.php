<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\User;
use App\Services\BondService;
use App\Services\TaskService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    public function test_notifications_are_private_paginated_and_read_idempotently(): void
    {
        $bond = Bond::factory()->active()->create();
        $owner = $bond->patient->user;
        $first = Notification::create(['user_id' => $owner->id, 'type' => 'message.received', 'resource_id' => 12]);
        $second = Notification::create(['user_id' => $owner->id, 'type' => 'task.assigned', 'resource_id' => 13]);
        $other = Notification::create(['user_id' => $bond->psychologist->user_id, 'type' => 'bond.requested', 'resource_id' => $bond->id]);
        $this->as($owner)->getJson('/api/v1/notifications?unread=1')->assertOk()->assertJsonPath('meta.total', 2)->assertJsonPath('data.0.id', $second->id);
        $read = $this->as($owner)->postJson("/api/v1/notifications/{$first->id}/read")->assertOk();
        $this->assertSame(['id', 'type', 'resource_id', 'created_at', 'read_at'], array_keys($read->json()));
        $this->travel(1)->minutes();
        $this->as($owner)->postJson("/api/v1/notifications/{$first->id}/read")->assertOk()->assertJsonPath('read_at', $read->json('read_at'));
        $this->as($owner)->postJson("/api/v1/notifications/{$other->id}/read")->assertNotFound();
        $this->as($owner)->postJson('/api/v1/notifications/read-all')->assertOk()->assertExactJson(['read' => 1]);
        $this->as($owner)->postJson('/api/v1/notifications/read-all')->assertExactJson(['read' => 0]);
        $this->as($owner)->getJson('/api/v1/notifications?unread=1')->assertJsonPath('meta.total', 0);
        $this->as($owner)->getJson('/api/v1/notifications?per_page=51')->assertUnprocessable();
        $this->as($owner)->getJson('/api/v1/notifications?unread=invalid')->assertUnprocessable();
        $this->assertNull($other->fresh()->read_at);
        $this->as(User::factory()->admin()->create())->getJson('/api/v1/notifications')->assertForbidden();
    }

    public function test_bond_request_acceptance_and_rejection_notify_only_recipient(): void
    {
        foreach (['accept', 'reject'] as $action) {
            $patient = Patient::factory()->create();
            $psychologist = Psychologist::factory()->published()->create();
            $bond = app(BondService::class)->request($patient->user, $psychologist->id);
            $this->assertDatabaseHas('notifications', ['user_id' => $psychologist->user_id, 'type' => 'bond.requested', 'resource_id' => $bond->id]);
            app(BondService::class)->{$action}($psychologist->user, $bond->id);
            $this->assertDatabaseHas('notifications', ['user_id' => $patient->user_id, 'type' => $action === 'accept' ? 'bond.accepted' : 'bond.rejected', 'resource_id' => $bond->id]);
        }
        $this->assertDatabaseCount('notifications', 4);
    }

    public function test_task_assignment_notifies_without_task_content(): void
    {
        $bond = Bond::factory()->active()->create();
        $term = ConsentTerm::create(['type' => 'general', 'version' => '1', 'body' => 'Termo fictício', 'effective_from' => now()->subDay(), 'published_by_user_id' => User::factory()->admin()->create()->id]);
        ConsentAcceptance::create(['user_id' => $bond->patient->user_id, 'consent_term_id' => $term->id]);
        $task = app(TaskService::class)->create($bond->psychologist->user, ['bond_id' => $bond->id, 'title' => 'Conteúdo reservado da tarefa', 'due_date' => now()->addDay()->toDateString()]);
        $this->assertDatabaseHas('notifications', ['user_id' => $bond->patient->user_id, 'type' => 'task.assigned', 'resource_id' => $task->id]);
        $this->as($bond->patient->user)->getJson('/api/v1/notifications')->assertOk()->assertDontSee('Conteúdo reservado');
    }
}
