<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\Task;
use App\Models\User;
use App\Services\BondService;
use App\Services\TaskService;
use Carbon\Carbon;
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

    public function test_listing_materializes_due_soon_task_reminders_once(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $bond = Bond::factory()->active()->create();
        $ended = Bond::factory()->ended()->create(['patient_id' => $bond->patient_id]);
        $task = fn (array $data) => Task::create([...['bond_id' => $bond->id, 'title' => 'Conteúdo reservado da tarefa', 'due_date' => '2026-10-21', 'created_by_user_id' => $bond->psychologist->user_id], ...$data]);
        $due = $task([]);
        $tomorrow = $task(['due_date' => '2026-10-22']);
        $task(['due_date' => '2026-10-20']);
        $task(['completed_at' => now()]);
        $task(['archived_at' => now()]);
        $task(['bond_id' => $ended->id]);
        $patient = $bond->patient->user;

        $this->as($patient)->getJson('/api/v1/notifications')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.type', 'task.due_soon')->assertJsonPath('data.0.resource_id', $due->id)->assertDontSee('Conteúdo reservado');
        $this->as($patient)->getJson('/api/v1/notifications?unread=1')->assertJsonPath('meta.total', 1);
        $this->as($bond->psychologist->user)->getJson('/api/v1/notifications')->assertJsonPath('meta.total', 0);
        $this->as(Patient::factory()->create()->user)->getJson('/api/v1/notifications')->assertJsonPath('meta.total', 0);
        $this->assertDatabaseCount('notifications', 1);

        $this->travelTo(Carbon::parse('2026-10-22 09:00:00'));
        $this->as($patient)->getJson('/api/v1/notifications')->assertJsonPath('meta.total', 2)->assertJsonPath('data.0.resource_id', $tomorrow->id);
        $this->assertDatabaseCount('notifications', 2);
    }

    public function test_listing_materializes_upcoming_appointment_reminders_for_both_sides_once(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $bond = Bond::factory()->active()->create();
        $ended = Bond::factory()->ended()->create(['psychologist_id' => $bond->psychologist_id]);
        $appointment = fn (array $data) => Appointment::create([...['bond_id' => $bond->id, 'status' => 'scheduled', 'notes' => 'Conteúdo reservado da consulta', 'created_by_user_id' => $bond->psychologist->user_id], ...$data]);
        $soon = $appointment(['scheduled_at' => now()->addHours(2)]);
        $moved = $appointment(['scheduled_at' => now()->addHours(23), 'status' => 'rescheduled']);
        $appointment(['scheduled_at' => now()->addHours(25)]);
        $appointment(['scheduled_at' => now()->subHour()]);
        $appointment(['scheduled_at' => now()->addHours(3), 'status' => 'cancelled']);
        $appointment(['scheduled_at' => now()->addHours(4), 'status' => 'done']);
        $appointment(['scheduled_at' => now()->addHours(5), 'bond_id' => $ended->id]);

        foreach ([$bond->patient->user, $bond->psychologist->user] as $user) {
            $this->as($user)->getJson('/api/v1/notifications')->assertOk()->assertJsonPath('meta.total', 2)->assertDontSee('Conteúdo reservado');
            $this->as($user)->getJson('/api/v1/notifications')->assertJsonPath('meta.total', 2);
            foreach ([$soon, $moved] as $item) {
                $this->assertDatabaseHas('notifications', ['user_id' => $user->id, 'type' => 'appointment.upcoming', 'resource_id' => $item->id]);
            }
        }
        $this->as($ended->patient->user)->getJson('/api/v1/notifications')->assertJsonPath('meta.total', 0);
        $this->assertDatabaseCount('notifications', 4);
    }

    public function test_rescheduled_appointment_gets_a_new_reminder_in_the_new_window(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $bond = Bond::factory()->active()->create();
        $appointment = Appointment::create(['bond_id' => $bond->id, 'scheduled_at' => now()->addHours(2), 'status' => 'scheduled', 'created_by_user_id' => $bond->psychologist->user_id]);
        $patient = $bond->patient->user;
        $reminders = fn () => Notification::where(['user_id' => $patient->id, 'type' => 'appointment.upcoming', 'resource_id' => $appointment->id])->count();

        $this->as($patient)->getJson('/api/v1/notifications')->assertOk();
        $this->assertSame(1, $reminders());

        $this->travel(5)->minutes();
        $appointment->update(['scheduled_at' => Carbon::parse('2026-10-23 11:00:00'), 'status' => 'rescheduled']);
        $this->as($patient)->getJson('/api/v1/notifications')->assertOk();
        $this->assertSame(1, $reminders());

        $this->travelTo(Carbon::parse('2026-10-22 12:00:00'));
        $this->as($patient)->getJson('/api/v1/notifications')->assertOk();
        $this->as($patient)->getJson('/api/v1/notifications')->assertOk();
        $this->assertSame(2, $reminders());
    }

    public function test_editing_only_notes_does_not_create_a_second_reminder(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $bond = Bond::factory()->active()->create();
        $appointment = Appointment::create(['bond_id' => $bond->id, 'scheduled_at' => now()->addHours(2), 'status' => 'scheduled', 'created_by_user_id' => $bond->psychologist->user_id]);
        $patient = $bond->patient->user;
        $reminders = fn () => Notification::where(['user_id' => $patient->id, 'type' => 'appointment.upcoming', 'resource_id' => $appointment->id])->count();

        $this->as($patient)->getJson('/api/v1/notifications')->assertOk();
        $this->assertSame(1, $reminders());

        $this->travel(5)->minutes();
        $appointment->update(['notes' => 'Levar o diario', 'modality' => 'online']);
        $this->as($patient)->getJson('/api/v1/notifications')->assertOk();
        $this->assertSame(1, $reminders());
    }

    public function test_task_with_changed_due_date_gets_a_new_reminder_on_the_new_day(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $bond = Bond::factory()->active()->create();
        $task = Task::create(['bond_id' => $bond->id, 'title' => 'Respirar', 'due_date' => '2026-10-21', 'created_by_user_id' => $bond->psychologist->user_id]);
        $patient = $bond->patient->user;
        $reminders = fn () => Notification::where(['user_id' => $patient->id, 'type' => 'task.due_soon', 'resource_id' => $task->id])->count();

        $this->as($patient)->getJson('/api/v1/notifications')->assertOk();
        $this->assertSame(1, $reminders());

        $this->travel(1)->hours();
        $task->update(['due_date' => '2026-10-23']);
        $this->travelTo(Carbon::parse('2026-10-23 09:00:00'));
        $this->as($patient)->getJson('/api/v1/notifications')->assertOk();
        $this->as($patient)->getJson('/api/v1/notifications')->assertOk();
        $this->assertSame(2, $reminders());
    }

    public function test_only_the_first_page_materializes_reminders(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $bond = Bond::factory()->active()->create();
        Appointment::create(['bond_id' => $bond->id, 'scheduled_at' => now()->addHours(2), 'status' => 'scheduled', 'created_by_user_id' => $bond->psychologist->user_id]);
        $patient = $bond->patient->user;

        $this->as($patient)->getJson('/api/v1/notifications?page=2')->assertOk();
        $this->assertDatabaseCount('notifications', 0);
        $this->as($patient)->getJson('/api/v1/notifications?page=1')->assertOk()->assertJsonPath('meta.total', 1);
        $this->assertDatabaseCount('notifications', 1);
    }
}
