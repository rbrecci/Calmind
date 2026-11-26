<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Medication;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// RF-27, RF-28, RF-29, RF-38, RF-39 e RF-17 (acesso a medicacao). DEC-10: a plataforma nao prescreve.
class MedicationTest extends TestCase
{
    use RefreshDatabase;

    private const PSY = '/api/v1/psychologist/medications';

    private const PAT = '/api/v1/patient/medications';

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    private function bond(): Bond
    {
        $bond = Bond::factory()->active()->create();
        $term = ConsentTerm::firstOrCreate(['type' => 'general', 'version' => '1.0'], [
            'body' => 'Termo de teste',
            'effective_from' => now()->subDay(),
            'published_by_user_id' => User::factory()->admin()->create()->id,
        ]);
        ConsentAcceptance::create(['user_id' => $bond->patient->user_id, 'consent_term_id' => $term->id]);

        return $bond;
    }

    private function payload(Bond $bond, array $overrides = []): array
    {
        return array_merge([
            'bond_id' => $bond->id,
            'name' => 'Sertralina',
            'dosage' => '50 mg',
            'prescription_source' => 'Dr. Paulo, psiquiatra',
            'schedules' => [['weekday' => now()->dayOfWeek, 'time_of_day' => '08:00']],
        ], $overrides);
    }

    private function register(Bond $bond, array $overrides = []): int
    {
        return $this->as($bond->psychologist->user)->postJson(self::PSY, $this->payload($bond, $overrides))
            ->assertCreated()->json('id');
    }

    public function test_psychologist_registers_medication_awaiting_confirmation_and_patient_is_notified(): void
    {
        $bond = $this->bond();

        $response = $this->as($bond->psychologist->user)->postJson(self::PSY, $this->payload($bond))->assertCreated();

        $response->assertJsonPath('status', 'awaiting_confirmation')
            ->assertJsonPath('prescription_source', 'Dr. Paulo, psiquiatra')
            ->assertJsonPath('schedules.0.time_of_day', '08:00')
            ->assertJsonPath('notice', 'A plataforma não prescreve nem altera prescrição médica.');
        $this->assertDatabaseHas('notifications', [
            'user_id' => $bond->patient->user_id, 'type' => 'medication.registered', 'resource_id' => $response->json('id'),
        ]);
    }

    public function test_prescription_source_and_schedules_are_required(): void
    {
        $bond = $this->bond();

        $this->as($bond->psychologist->user)->postJson(self::PSY, $this->payload($bond, ['prescription_source' => '']))
            ->assertUnprocessable();
        $this->as($bond->psychologist->user)->postJson(self::PSY, $this->payload($bond, ['schedules' => []]))
            ->assertUnprocessable();
        $this->as($bond->psychologist->user)->postJson(self::PSY, $this->payload($bond, ['status' => 'active']))
            ->assertUnprocessable();
        $this->assertSame(0, Medication::count());
    }

    public function test_psychologist_cannot_register_for_other_psychologists_bond_or_ended_bond(): void
    {
        $bond = $this->bond();
        $other = $this->bond();

        $this->as($bond->psychologist->user)->postJson(self::PSY, $this->payload($other))->assertNotFound();

        $bond->update(['status' => 'ended']);
        $this->as($bond->psychologist->user)->postJson(self::PSY, $this->payload($bond))->assertStatus(409);
    }

    public function test_patient_confirms_and_medication_becomes_active(): void
    {
        $bond = $this->bond();
        $id = $this->register($bond);

        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/confirm")
            ->assertOk()->assertJsonPath('status', 'active');
        $this->assertDatabaseHas('notifications', [
            'user_id' => $bond->psychologist->user_id, 'type' => 'medication.confirmed', 'resource_id' => $id,
        ]);
        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/confirm")->assertStatus(409);
    }

    public function test_refusal_requires_reason_and_is_visible_to_psychologist(): void
    {
        $bond = $this->bond();
        $id = $this->register($bond);

        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/refuse", [])->assertUnprocessable();
        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/refuse", ['reason' => 'Não tomo essa medicação'])
            ->assertOk()->assertJsonPath('status', 'refused');

        $this->as($bond->psychologist->user)->getJson(self::PSY."/{$id}")
            ->assertOk()->assertJsonPath('status', 'refused')
            ->assertJsonPath('refusal_reason', 'Não tomo essa medicação');
    }

    public function test_patient_suspends_active_medication_and_cannot_suspend_twice(): void
    {
        $bond = $this->bond();
        $id = $this->register($bond);

        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/suspend")->assertStatus(409);
        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/confirm")->assertOk();
        $first = $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/suspend")
            ->assertOk()->assertJsonPath('status', 'suspended')->assertJsonPath('suspended_by', 'patient');
        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/suspend")->assertStatus(409);

        $this->assertSame($first->json('suspended_at'), $this->as($bond->psychologist->user)->getJson(self::PSY."/{$id}")
            ->assertJsonPath('suspended_by', 'patient')->json('suspended_at'));
    }

    public function test_psychologist_cannot_reactivate_a_suspended_medication(): void
    {
        $bond = $this->bond();
        $id = $this->register($bond);
        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/confirm");
        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/suspend");

        $this->as($bond->psychologist->user)->postJson(self::PSY."/{$id}/reactivate")->assertStatus(409);
        $this->assertSame('suspended', Medication::find($id)->status);
    }

    public function test_reminder_only_exists_for_active_medication_and_never_presumes_intake(): void
    {
        $this->travelTo(now()->setTime(10, 0));
        $bond = $this->bond();
        $id = $this->register($bond);
        $list = fn () => $this->as($bond->patient->user)->getJson('/api/v1/notifications')->assertOk();

        // aguardando confirmacao: sem lembrete (CA-27.2)
        $list();
        $this->assertSame(0, Notification::where('type', 'medication.reminder')->count());

        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/confirm");
        $list();
        $this->assertSame(1, Notification::where('type', 'medication.reminder')->where('user_id', $bond->patient->user_id)->count());
        $list(); // nao duplica o mesmo horario
        $this->assertSame(1, Notification::where('type', 'medication.reminder')->count());

        // a tomada nao marcada continua nao marcada (CA-28.4)
        $this->as($bond->patient->user)->getJson(self::PAT.'/doses')->assertJsonPath('data.0.taken', false);
    }

    public function test_suspended_medication_does_not_remind(): void
    {
        $this->travelTo(now()->setTime(10, 0));
        $bond = $this->bond();
        $id = $this->register($bond);
        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/confirm");
        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/suspend");

        $this->as($bond->patient->user)->getJson('/api/v1/notifications')->assertOk();

        $this->assertSame(0, Notification::where('type', 'medication.reminder')->count());
    }

    public function test_patient_marks_intake_and_it_is_recorded_once(): void
    {
        $this->travelTo(now()->setTime(10, 0));
        $bond = $this->bond();
        $id = $this->register($bond);
        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/confirm");
        $slot = now()->setTime(8, 0)->format('Y-m-d H:i');

        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/intakes", ['scheduled_for' => $slot])
            ->assertOk()->assertJsonStructure(['marked_at']);
        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/intakes", ['scheduled_for' => $slot])->assertOk();
        $this->assertDatabaseCount('medication_intakes', 1);

        $this->as($bond->patient->user)->getJson(self::PAT.'/doses')->assertJsonPath('data.0.taken', true);
        // horario que nao existe na agenda da medicacao
        $this->as($bond->patient->user)->postJson(self::PAT."/{$id}/intakes", ['scheduled_for' => now()->setTime(9, 30)->format('Y-m-d H:i')])
            ->assertStatus(422);
    }

    public function test_other_patient_cannot_see_or_change_medication(): void
    {
        $bond = $this->bond();
        $stranger = $this->bond();
        $id = $this->register($bond);

        $this->as($stranger->patient->user)->getJson(self::PAT."/{$id}")->assertNotFound();
        $this->as($stranger->patient->user)->postJson(self::PAT."/{$id}/confirm")->assertNotFound();
        $this->as($stranger->psychologist->user)->getJson(self::PSY."/{$id}")->assertNotFound();
    }

    public function test_psychologist_access_is_audited_including_denied_attempts(): void
    {
        $bond = $this->bond();
        $stranger = $this->bond();
        $id = $this->register($bond);

        $this->as($bond->psychologist->user)->getJson(self::PSY."?bond_id={$bond->id}")->assertOk();
        $this->as($stranger->psychologist->user)->getJson(self::PSY."/{$id}")->assertNotFound();

        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $bond->psychologist->user_id, 'action' => 'read_medication',
            'resource_id' => $id, 'target_patient_id' => $bond->patient_id, 'result' => 'allowed',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $stranger->psychologist->user_id, 'action' => 'read_medication', 'result' => 'denied',
        ]);
    }

    public function test_opening_patient_record_is_audited(): void
    {
        $bond = $this->bond();
        $stranger = $this->bond();

        $this->as($bond->psychologist->user)->getJson('/api/v1/psychologist/patients/'.$bond->patient->user_id)->assertOk();
        $this->as($stranger->psychologist->user)->getJson('/api/v1/psychologist/patients/'.$bond->patient->user_id)->assertNotFound();

        $this->assertSame(1, AuditLog::where('action', 'read_patient_record')->where('result', 'allowed')->count());
        $this->assertSame(1, AuditLog::where('action', 'read_patient_record')->where('result', 'denied')->count());
    }
}
