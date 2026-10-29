<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Bond;
use App\Models\Message;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PatientDirectoryTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    public function test_profiles_include_not_submitted_and_existing_registration(): void
    {
        $this->as(User::factory()->psychologist()->create())->getJson('/api/v1/psychologist/profile')->assertOk()->assertJsonPath('approval_status', 'not_submitted')->assertJsonPath('id', null)->assertJsonPath('crp', null);
        $psy = Psychologist::factory()->approved()->create();
        $this->as($psy->user)->getJson('/api/v1/psychologist/profile')->assertOk()->assertJsonPath('id', $psy->id)->assertJsonPath('crp', $psy->crp_region.'/'.$psy->crp_number);
    }

    public function test_patient_lists_own_bonds_and_unread_messages(): void
    {
        $bond = Bond::factory()->active()->create();
        Bond::factory()->ended()->create(['patient_id' => $bond->patient_id]);
        Bond::factory()->create(['patient_id' => $bond->patient_id]);
        Bond::factory()->active()->create();
        Message::create(['bond_id' => $bond->id, 'sender_user_id' => $bond->psychologist->user_id, 'body' => 'Texto fictício']);
        Message::create(['bond_id' => $bond->id, 'sender_user_id' => $bond->patient->user_id, 'body' => 'Resposta fictícia']);
        $this->as($bond->patient->user)->getJson('/api/v1/patient/bonds')->assertOk()->assertJsonPath('meta.total', 3)->assertJsonPath('data.0.status', 'active')->assertJsonPath('data.0.unread_messages', 1)->assertJsonPath('data.1.status', 'pending')->assertJsonPath('data.2.status', 'ended');
    }

    public function test_directory_counts_only_relevant_tasks_messages_and_appointments(): void
    {
        $bond = Bond::factory()->active()->create();
        $ended = Bond::factory()->ended()->create(['psychologist_id' => $bond->psychologist_id]);
        $pending = Bond::factory()->create(['psychologist_id' => $bond->psychologist_id]);
        Message::create(['bond_id' => $bond->id, 'sender_user_id' => $bond->patient->user_id, 'body' => 'Texto fictício']);
        foreach ([[], ['completed_at' => now()], ['archived_at' => now()]] as $extra) {
            Task::create(array_merge(['bond_id' => $bond->id, 'title' => 'Tarefa fictícia', 'due_date' => now()->subDay(), 'created_by_user_id' => $bond->psychologist->user_id], $extra));
        }
        $appointment = Appointment::create(['bond_id' => $bond->id, 'scheduled_at' => now()->addDay(), 'status' => 'scheduled', 'created_by_user_id' => $bond->psychologist->user_id]);
        $response = $this->as($bond->psychologist->user)->getJson('/api/v1/psychologist/patients')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.patient.id', $bond->patient->user_id)->assertJsonPath('data.0.unread_messages', 1)->assertJsonPath('data.0.overdue_tasks', 1)->assertJsonPath('data.0.next_appointment_at', $appointment->scheduled_at->toIso8601String());
        $this->assertSame(['bond_id', 'status', 'since', 'ended_at', 'patient', 'unread_messages', 'overdue_tasks', 'next_appointment_at'], array_keys($response->json('data.0')));
        $this->getJson('/api/v1/psychologist/patients?status=ended')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.bond_id', $ended->id)->assertJsonPath('data.0.unread_messages', 0)->assertJsonPath('data.0.overdue_tasks', 0)->assertJsonPath('data.0.next_appointment_at', null);
        $this->getJson('/api/v1/psychologist/bond-requests')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $pending->id);
    }

    public function test_detail_is_scoped_to_own_active_or_ended_bonds_and_shows_guardian_for_minors(): void
    {
        $minor = Patient::factory()->minor()->create();
        $bond = Bond::factory()->active()->create(['patient_id' => $minor->id]);
        $this->as($bond->psychologist->user)->getJson('/api/v1/psychologist/patients/'.$minor->user_id)->assertOk()->assertJsonPath('is_minor', true)->assertJsonPath('guardian.name', $minor->guardian_name);
        $bond->update(['status' => 'ended', 'ended_at' => now()]);
        $this->getJson('/api/v1/psychologist/patients/'.$minor->user_id)->assertOk()->assertJsonPath('bond_status', 'ended');
        $this->as(Psychologist::factory()->approved()->create()->user)->getJson('/api/v1/psychologist/patients/'.$minor->user_id)->assertNotFound();
        $bond->psychologist->update(['approval_status' => 'rejected']);
        foreach (['patients', 'bond-requests', 'patients/'.$minor->user_id] as $path) {
            $this->as($bond->psychologist->user)->getJson('/api/v1/psychologist/'.$path)->assertForbidden();
        }
    }
}
