<?php

namespace Tests\Feature;

use App\Models\Analysis;
use App\Models\AnalysisVersion;
use App\Models\Appointment;
use App\Models\Bond;
use App\Models\Medication;
use App\Models\Patient;
use App\Models\Report;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

// RF-36: prontuario consolidado (GET /psychologist/patients/{id}/record)
class PatientRecordTest extends TestCase
{
    use RefreshDatabase;

    private Bond $bond;

    protected function setUp(): void
    {
        parent::setUp();
        $this->bond = Bond::factory()->active()->create();
    }

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    private function url(?Bond $bond = null, string $query = ''): string
    {
        return '/api/v1/psychologist/patients/'.($bond ?? $this->bond)->patient->user_id.'/record'.$query;
    }

    private function psy(): User
    {
        return $this->bond->psychologist->user;
    }

    // um item de cada tipo, em horarios distintos do mesmo dia, para a ordem ser verificavel
    private function fill(): void
    {
        $day = now()->subDays(2);
        Report::factory()->forBond($this->bond)->create(['body' => 'COMPARTILHADO dormi mal', 'created_at' => $day->copy()->setTime(9, 0)]);
        Report::factory()->forBond($this->bond)->private()->create(['body' => 'MARCADOR-PRIVADO nunca aparece', 'created_at' => $day->copy()->setTime(9, 30)]);
        Report::factory()->forBond($this->bond)->unpublished()->create(['body' => 'MARCADOR-DESPUBLICADO retirado', 'created_at' => $day->copy()->setTime(9, 45)]);
        Task::create(['bond_id' => $this->bond->id, 'title' => 'Respirar', 'due_date' => now()->addDay()->toDateString(), 'created_by_user_id' => $this->psy()->id])->forceFill(['created_at' => $day->copy()->setTime(10, 0)])->save();
        Appointment::create(['bond_id' => $this->bond->id, 'scheduled_at' => $day->copy()->setTime(11, 0), 'status' => 'done', 'modality' => 'online', 'created_by_user_id' => $this->psy()->id]);
        $medication = Medication::create(['bond_id' => $this->bond->id, 'name' => 'Sertralina', 'prescription_source' => 'Dr. Paulo', 'registered_by_user_id' => $this->psy()->id]);
        $medication->forceFill(['created_at' => $day->copy()->setTime(12, 0)])->save();
        $medication->schedules()->create(['weekday' => 1, 'time_of_day' => '08:00:00']);
        $analysis = Analysis::create(['bond_id' => $this->bond->id, 'requested_by_user_id' => $this->psy()->id, 'period_start' => $day->toDateString(), 'period_end' => $day->toDateString(), 'status' => 'confirmed', 'confirmed_at' => $day->copy()->setTime(13, 0)]);
        AnalysisVersion::create(['analysis_id' => $analysis->id, 'body' => 'Resumo confirmado', 'edited_by_user_id' => $this->psy()->id]);
        // sugestao ainda em revisao: nao entra no prontuario
        Analysis::create(['bond_id' => $this->bond->id, 'requested_by_user_id' => $this->psy()->id, 'period_start' => $day->toDateString(), 'period_end' => $day->toDateString(), 'status' => 'generated', 'summary_raw' => 'SUGESTAO-NAO-CONFIRMADA']);
    }

    public function test_record_consolidates_every_type_in_chronological_order(): void
    {
        $this->fill();

        $response = $this->as($this->psy())->getJson($this->url())->assertOk()
            ->assertJsonPath('bond_status', 'active')
            ->assertJsonPath('patient.id', $this->bond->patient->user_id)
            ->assertJsonPath('totals.report', 1)->assertJsonPath('totals.task', 1)->assertJsonPath('totals.appointment', 1)->assertJsonPath('totals.medication', 1)->assertJsonPath('totals.analysis', 1);

        $this->assertSame(['report', 'task', 'appointment', 'medication', 'analysis'], array_column($response->json('timeline'), 'type'));
        $this->assertSame('Respirar', $response->json('timeline.1.data.title'));
        $this->assertSame('Sertralina', $response->json('timeline.3.data.name'));
        $this->assertSame('Resumo confirmado', $response->json('timeline.4.data.summary'));
    }

    public function test_order_can_be_reversed(): void
    {
        $this->fill();

        $types = array_column($this->as($this->psy())->getJson($this->url(null, '?order=desc'))->assertOk()->json('timeline'), 'type');

        $this->assertSame(['analysis', 'medication', 'appointment', 'task', 'report'], $types);
    }

    public function test_private_and_unpublished_reports_and_unconfirmed_suggestions_leave_no_trace(): void
    {
        $this->fill();

        $raw = $this->as($this->psy())->getJson($this->url())->assertOk()->getContent();

        $this->assertStringNotContainsString('MARCADOR-', $raw);
        $this->assertStringNotContainsString('SUGESTAO-NAO-CONFIRMADA', $raw);
        $this->assertStringContainsString('COMPARTILHADO dormi mal', $raw);
    }

    public function test_period_filters_every_type(): void
    {
        $this->fill();

        $this->as($this->psy())->getJson($this->url(null, '?from='.now()->subDay()->toDateString()))
            ->assertOk()->assertJsonPath('totals', [])->assertJsonPath('timeline', []);
        $this->as($this->psy())->getJson($this->url(null, '?from='.now()->subDays(3)->toDateString().'&to='.now()->subDay()->toDateString()))
            ->assertOk()->assertJsonPath('totals.report', 1);
    }

    public function test_period_validation(): void
    {
        $this->as($this->psy())->getJson($this->url(null, '?from=2026-13-40'))->assertUnprocessable();
        $this->as($this->psy())->getJson($this->url(null, '?from=2026-05-01&to=2026-04-01'))->assertUnprocessable();
        $this->as($this->psy())->getJson($this->url(null, '?from='.now()->subDays(400)->toDateString()))->assertUnprocessable();
        $this->as($this->psy())->getJson($this->url(null, '?order=sideways'))->assertUnprocessable();
    }

    public function test_opening_the_record_is_audited_and_unlinked_psychologist_is_denied_and_audited(): void
    {
        $stranger = Bond::factory()->active()->create()->psychologist->user;

        $this->as($this->psy())->getJson($this->url())->assertOk();
        $this->as($stranger)->getJson($this->url())->assertNotFound();

        $this->assertDatabaseHas('audit_logs', ['actor_user_id' => $this->psy()->id, 'action' => 'read_patient_record', 'result' => 'allowed', 'target_patient_id' => $this->bond->patient_id]);
        $this->assertDatabaseHas('audit_logs', ['actor_user_id' => $stranger->id, 'action' => 'read_patient_record', 'result' => 'denied']);
    }

    public function test_patient_and_admin_cannot_open_the_record(): void
    {
        $this->as($this->bond->patient->user)->getJson($this->url())->assertForbidden();
        $this->as(User::factory()->admin()->create())->getJson($this->url())->assertForbidden();
    }

    public function test_minor_shows_the_guardian_contact(): void
    {
        $minor = Patient::factory()->minor()->create();
        $bond = Bond::factory()->active()->create(['patient_id' => $minor->id, 'psychologist_id' => $this->bond->psychologist_id]);

        $this->as($this->psy())->getJson($this->url($bond))->assertOk()
            ->assertJsonPath('is_minor', true)->assertJsonPath('guardian.name', $minor->guardian_name)
            ->assertJsonPath('guardian.phone', $minor->guardian_phone);
        $this->as($this->psy())->getJson($this->url())->assertOk()->assertJsonPath('guardian', null);
    }

    public function test_ended_bond_keeps_the_history_and_a_new_bond_merges_it(): void
    {
        $this->fill();
        $this->bond->update(['status' => 'ended', 'ended_at' => now()]);

        $this->as($this->psy())->getJson($this->url())->assertOk()
            ->assertJsonPath('bond_status', 'ended')->assertJsonPath('totals.report', 1);

        // novo vinculo do mesmo psicologo com o mesmo paciente: o historico anterior continua no prontuario
        $new = Bond::factory()->active()->create(['patient_id' => $this->bond->patient_id, 'psychologist_id' => $this->bond->psychologist_id]);
        Report::factory()->forBond($new)->create(['body' => 'COMPARTILHADO depois do novo vinculo', 'created_at' => now()->subHour()]);

        $this->as($this->psy())->getJson($this->url())->assertOk()
            ->assertJsonPath('bond_status', 'active')->assertJsonPath('totals.report', 2);
    }

    public function test_other_psychologists_data_never_mixes_in(): void
    {
        $this->fill();
        $other = Bond::factory()->ended()->create(['patient_id' => $this->bond->patient_id]);
        Report::factory()->forBond($other)->create(['body' => 'COMPARTILHADO com OUTRO psicologo', 'created_at' => now()->subHour()]);
        Task::create(['bond_id' => $other->id, 'title' => 'Tarefa do outro', 'due_date' => now()->addDay()->toDateString(), 'created_by_user_id' => $other->psychologist->user_id]);

        $raw = $this->as($this->psy())->getJson($this->url())->assertOk()->getContent();

        $this->assertStringNotContainsString('OUTRO psicologo', $raw);
        $this->assertStringNotContainsString('Tarefa do outro', $raw);
    }

    public function test_archived_tasks_are_left_out(): void
    {
        Task::create(['bond_id' => $this->bond->id, 'title' => 'Arquivada', 'due_date' => now()->addDay()->toDateString(), 'created_by_user_id' => $this->psy()->id, 'archived_at' => now()]);

        $this->as($this->psy())->getJson($this->url())->assertOk()->assertJsonPath('totals', []);
    }
}
