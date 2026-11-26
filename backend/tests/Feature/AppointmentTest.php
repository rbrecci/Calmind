<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Bond;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    private function data(Bond $bond): array
    {
        return ['bond_id' => $bond->id, 'scheduled_at' => now()->addDays(2)->startOfHour()->toIso8601String(), 'modality' => 'online', 'notes' => 'Encontro fictício'];
    }

    public function test_schedule_conflict_confirmation_reschedule_and_cancel(): void
    {
        $bond = Bond::factory()->active()->create();
        $url = '/api/v1/psychologist/appointments';
        $data = $this->data($bond);
        $created = $this->as($bond->psychologist->user)->postJson($url, $data)->assertCreated()
            ->assertJsonPath('status', 'scheduled')->assertJsonPath('patient.id', $bond->patient->user_id);
        $id = $created->json('id');
        $this->assertDatabaseHas('notifications', ['user_id' => $bond->patient->user_id, 'type' => 'appointment.scheduled', 'resource_id' => $id]);
        $this->as($bond->psychologist->user)->postJson($url, $data)->assertUnprocessable()->assertJsonValidationErrors('confirm_conflict');
        $this->as($bond->psychologist->user)->postJson($url, [...$data, 'confirm_conflict' => true])->assertCreated();
        $this->as($bond->psychologist->user)->putJson("{$url}/{$id}", ['scheduled_at' => now()->addDays(3)->toIso8601String()])
            ->assertOk()->assertJsonPath('status', 'rescheduled');
        $this->assertDatabaseHas('notifications', ['user_id' => $bond->patient->user_id, 'type' => 'appointment.rescheduled', 'resource_id' => $id]);
        $this->as($bond->psychologist->user)->postJson("{$url}/{$id}/cancel")->assertOk()->assertJsonPath('status', 'cancelled');
        $this->as($bond->psychologist->user)->postJson("{$url}/{$id}/cancel")->assertOk()->assertJsonPath('status', 'cancelled');
        $this->assertDatabaseHas('notifications', ['user_id' => $bond->patient->user_id, 'type' => 'appointment.cancelled', 'resource_id' => $id]);
        $this->assertDatabaseCount('notifications', 4);
        $this->as($bond->psychologist->user)->putJson("{$url}/{$id}", ['notes' => 'Alterada'])->assertStatus(409);
        Appointment::findOrFail($id)->update(['status' => 'done']);
        $this->as($bond->psychologist->user)->postJson("{$url}/{$id}/cancel")->assertStatus(409);
        $this->as($bond->psychologist->user)->putJson("{$url}/{$id}", ['notes' => 'Realizada'])->assertStatus(409);
    }

    public function test_patient_listing_is_scoped_and_dates_are_inclusive(): void
    {
        $bond = Bond::factory()->active()->create();
        $other = Bond::factory()->active()->create();
        $url = '/api/v1/psychologist/appointments';
        $data = $this->data($bond);
        $this->as($bond->psychologist->user)->postJson($url, $data)->assertCreated();
        $this->as($other->psychologist->user)->postJson($url, $this->data($other))->assertCreated();
        $day = now()->addDays(2)->toDateString();
        $bond->update(['status' => 'ended']);
        $this->as($bond->patient->user)->getJson("/api/v1/patient/appointments?from={$day}&to={$day}")->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.bond_id', $bond->id)
            ->assertJsonPath('data.0.psychologist.id', $bond->psychologist_id);
        $this->as($bond->patient->user)->getJson('/api/v1/patient/appointments?from='.now()->addDays(4)->toDateString())->assertJsonPath('meta.total', 0);
    }

    public function test_permissions_inactive_bonds_past_dates_and_foreign_resources(): void
    {
        $bond = Bond::factory()->active()->create();
        $other = Bond::factory()->active()->create();
        $url = '/api/v1/psychologist/appointments';
        $data = $this->data($bond);
        $this->getJson($url)->assertUnauthorized();
        $this->as($bond->patient->user)->postJson($url, $data)->assertForbidden();
        $this->as($other->psychologist->user)->postJson($url, $data)->assertNotFound();
        $this->as($bond->psychologist->user)->postJson($url, [...$data, 'scheduled_at' => now()->subDay()->toIso8601String()])->assertUnprocessable()->assertJsonValidationErrors('scheduled_at');
        $id = $this->as($bond->psychologist->user)->postJson($url, $data)->assertCreated()->json('id');
        $this->as($other->psychologist->user)->putJson("{$url}/{$id}", ['notes' => 'Alheia'])->assertNotFound();
        $this->as($other->psychologist->user)->postJson("{$url}/{$id}/cancel")->assertNotFound();
        $this->as($other->psychologist->user)->getJson($url.'?bond_id='.$bond->id)->assertNotFound();
        foreach (['ended', 'pending'] as $status) {
            $bond->update(['status' => $status]);
            $this->as($bond->psychologist->user)->postJson($url, $data)->assertStatus(409);
        }
        $bond->psychologist->update(['approval_status' => 'pending']);
        $this->as($bond->psychologist->user)->getJson($url)->assertForbidden();
    }

    public function test_conflict_window_is_configurable_and_excludes_cancelled_and_self(): void
    {
        config(['calmind.appointment.conflict_minutes' => 90]);
        $bond = Bond::factory()->active()->create();
        $url = '/api/v1/psychologist/appointments';
        $data = $this->data($bond);
        $id = $this->as($bond->psychologist->user)->postJson($url, $data)->assertCreated()->json('id');
        $this->as($bond->psychologist->user)->putJson("{$url}/{$id}", ['notes' => 'Sem conflito próprio'])->assertOk();
        $data['scheduled_at'] = now()->addDays(2)->startOfHour()->addMinutes(75)->toIso8601String();
        $this->as($bond->psychologist->user)->postJson($url, $data)->assertUnprocessable()->assertJsonValidationErrors('confirm_conflict');
        $this->as($bond->psychologist->user)->postJson("{$url}/{$id}/cancel")->assertOk();
        $this->as($bond->psychologist->user)->postJson($url, $data)->assertCreated();
    }

    public function test_default_conflict_window_allows_exactly_sixty_minutes_and_validates_offset(): void
    {
        $bond = Bond::factory()->active()->create();
        $url = '/api/v1/psychologist/appointments';
        $data = $this->data($bond);
        $firstId = $this->as($bond->psychologist->user)->postJson($url, $data)->assertCreated()->json('id');
        $data['scheduled_at'] = now()->addDays(2)->startOfHour()->addMinutes(60)->toIso8601String();
        $secondId = $this->as($bond->psychologist->user)->postJson($url, $data)->assertCreated()->json('id');
        $this->as($bond->psychologist->user)->putJson("{$url}/{$secondId}", ['scheduled_at' => now()->addDays(2)->startOfHour()->addMinutes(30)->toIso8601String()])
            ->assertUnprocessable()->assertJsonValidationErrors('confirm_conflict');
        $this->as($bond->psychologist->user)->putJson("{$url}/{$secondId}", ['scheduled_at' => now()->addDays(2)->startOfHour()->addMinutes(30)->toIso8601String(), 'confirm_conflict' => true])
            ->assertOk()->assertJsonPath('status', 'rescheduled');
        $this->as($bond->psychologist->user)->putJson("{$url}/{$firstId}", ['scheduled_at' => now()->addDays(3)->toDateTimeString()])
            ->assertUnprocessable()->assertJsonValidationErrors('scheduled_at');
    }
}
