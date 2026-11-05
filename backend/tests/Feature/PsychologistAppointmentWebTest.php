<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Bond;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PsychologistAppointmentWebTest extends TestCase
{
    use RefreshDatabase;

    private const URL = '/psychologist/appointments';

    private const CONFLICT_MESSAGE = 'Este horário conflita com outra consulta. Confirme para agendar mesmo assim.';

    private function day(): string
    {
        return now()->addDays(7)->toDateString();
    }

    private function form(Bond $bond, array $overrides = []): array
    {
        return [
            'bond_id' => $bond->id,
            'scheduled_date' => $this->day(),
            'scheduled_time' => '14:30',
            'modality' => 'online',
            'notes' => 'Encontro fictício',
            ...$overrides,
        ];
    }

    private function appointmentFor(Bond $bond, array $overrides = []): Appointment
    {
        return Appointment::create([
            'bond_id' => $bond->id,
            'scheduled_at' => Carbon::parse($this->day().' 09:00', 'America/Sao_Paulo'),
            'status' => 'scheduled',
            'notes' => 'Consulta de teste',
            'created_by_user_id' => $bond->psychologist->user_id,
            ...$overrides,
        ]);
    }

    private function postForm(User $user, array $form)
    {
        return $this->actingAs($user)->from(self::URL)->post(self::URL, $form);
    }

    public function test_form_warns_that_the_patient_reads_the_notes(): void
    {
        $bond = Bond::factory()->active()->create();

        $this->actingAs($bond->psychologist->user)->get(self::URL)->assertOk()
            ->assertSee('O paciente vê esta observação no app. Não use para anotação clínica.')
            ->assertSee('aria-describedby="notes-hint', false);
    }

    public function test_page_lists_only_the_psychologists_own_appointments(): void
    {
        $own = Bond::factory()->active()->create();
        $other = Bond::factory()->active()->create();
        $ended = Bond::factory()->ended()->create(['psychologist_id' => $own->psychologist_id]);
        $this->appointmentFor($own, ['notes' => 'Consulta minha', 'modality' => 'presencial']);
        $this->appointmentFor($ended, ['notes' => 'Consulta antiga', 'status' => 'cancelled', 'scheduled_at' => Carbon::parse($this->day().' 16:00', 'America/Sao_Paulo')]);
        $this->appointmentFor($other, ['notes' => 'Consulta alheia']);

        $this->actingAs($own->psychologist->user)->get(self::URL)->assertOk()
            ->assertSee('Consulta minha')
            ->assertSee($own->patient->user->name)
            ->assertSee(Carbon::parse($this->day())->format('d/m/Y').' às 09:00')
            ->assertSee('Presencial')
            ->assertSee('Agendada')
            ->assertSee('Consulta antiga')
            ->assertSee('Cancelada')
            ->assertSee('Vínculo encerrado')
            ->assertDontSee('Consulta alheia')
            ->assertDontSee($other->patient->user->name);
    }

    public function test_valid_post_records_appointment_and_patient_api_returns_it(): void
    {
        $bond = Bond::factory()->active()->create();

        $this->actingAs($bond->psychologist->user)->get(self::URL)->assertOk()->assertSee('name="_token"', false);
        $this->postForm($bond->psychologist->user, $this->form($bond))
            ->assertRedirect(self::URL)->assertSessionHasNoErrors()->assertSessionHas('status', 'Consulta agendada.');

        $appointment = Appointment::query()->sole();
        $this->assertSame($bond->id, $appointment->bond_id);
        $this->assertSame('scheduled', $appointment->status);
        $this->assertSame('online', $appointment->modality);
        $this->assertSame('Encontro fictício', $appointment->notes);
        $this->assertSame($bond->psychologist->user_id, $appointment->created_by_user_id);
        $this->assertDatabaseHas('notifications', ['user_id' => $bond->patient->user_id, 'type' => 'appointment.scheduled', 'resource_id' => $appointment->id]);

        $this->get(self::URL)->assertOk()->assertSee('Consulta agendada.')->assertSee('Encontro fictício');

        $this->app['auth']->forgetGuards();
        $this->withToken($bond->patient->user->createToken('mobile')->plainTextToken)
            ->getJson('/api/v1/patient/appointments')->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $appointment->id)
            ->assertJsonPath('data.0.notes', 'Encontro fictício');
    }

    public function test_recorded_time_matches_what_was_typed_in_sao_paulo(): void
    {
        $bond = Bond::factory()->active()->create();

        $this->postForm($bond->psychologist->user, $this->form($bond, [
            // O horario vem dos campos do formulario: um scheduled_at forjado nao pode vencer
            'scheduled_at' => now()->addDays(30)->toIso8601String(),
        ]))->assertRedirect(self::URL)->assertSessionHasNoErrors();

        $typed = Carbon::parse($this->day().' 14:30', 'America/Sao_Paulo');
        $this->assertTrue(Appointment::query()->sole()->scheduled_at->equalTo($typed));
        $this->assertSame($this->day().' 14:30:00', DB::table('appointments')->value('scheduled_at'));

        $this->app['auth']->forgetGuards();
        $this->withToken($bond->patient->user->createToken('mobile')->plainTextToken)
            ->getJson('/api/v1/patient/appointments')->assertOk()
            ->assertJsonPath('data.0.scheduled_at', $this->day().'T14:30:00-03:00');
    }

    public function test_modality_and_notes_follow_the_api_rules(): void
    {
        $bond = Bond::factory()->active()->create();
        $user = $bond->psychologist->user;

        $this->postForm($user, $this->form($bond, ['modality' => 'telepatia']))->assertSessionHasErrors('modality');
        $this->postForm($user, $this->form($bond, ['notes' => str_repeat('a', 256)]))->assertSessionHasErrors('notes');
        $this->assertDatabaseCount('appointments', 0);

        $this->postForm($user, $this->form($bond, ['modality' => '', 'notes' => '']))->assertSessionHasNoErrors();
        $appointment = Appointment::query()->sole();
        $this->assertNull($appointment->modality);
        $this->assertNull($appointment->notes);
        $this->get(self::URL)->assertSee('Modalidade não informada');
    }

    public function test_bond_of_another_psychologist_is_refused(): void
    {
        $own = Bond::factory()->active()->create();
        $other = Bond::factory()->active()->create();

        $this->actingAs($own->psychologist->user)->get(self::URL)->assertOk();
        $this->postForm($own->psychologist->user, $this->form($other))->assertNotFound();
        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_ended_bond_is_refused_with_the_service_message(): void
    {
        $ended = Bond::factory()->ended()->create();

        $this->actingAs($ended->psychologist->user)->from(self::URL)->followingRedirects()
            ->post(self::URL, $this->form($ended))
            ->assertOk()
            ->assertSee('O vínculo não está ativo.');
        $this->assertDatabaseCount('appointments', 0);

        $this->postForm($ended->psychologist->user, $this->form($ended))
            ->assertRedirect(self::URL)
            ->assertSessionHasErrors(['bond_id' => 'O vínculo não está ativo.']);
        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_conflict_without_confirmation_does_not_record_and_keeps_what_was_typed(): void
    {
        $bond = Bond::factory()->active()->create();
        $this->appointmentFor($bond, ['scheduled_at' => Carbon::parse($this->day().' 14:00', 'America/Sao_Paulo')]);
        $form = $this->form($bond, ['modality' => 'presencial', 'notes' => 'Primeira conversa']);

        $this->postForm($bond->psychologist->user, $form)
            ->assertRedirect(self::URL)->assertSessionHasErrors('confirm_conflict');
        $this->assertDatabaseCount('appointments', 1);

        $page = $this->actingAs($bond->psychologist->user)->from(self::URL)->followingRedirects()
            ->post(self::URL, $form)->assertOk()
            ->assertSee(self::CONFLICT_MESSAGE)
            ->assertSee('Agendar mesmo assim')
            ->assertSee('Escolher outro horário')
            ->assertSee('href="#scheduled_date"', false)
            ->assertSee('<input type="hidden" name="confirm_conflict" value="1">', false)
            // O formulario de confirmacao reenvia exatamente o horario recusado
            ->assertSee('<input type="hidden" name="scheduled_date" value="'.$this->day().'">', false)
            ->assertSee('<input type="hidden" name="scheduled_time" value="14:30">', false)
            ->assertSee('<input type="hidden" name="bond_id" value="'.$bond->id.'">', false)
            ->assertSee('<input type="hidden" name="modality" value="presencial">', false)
            ->assertSee('<input type="hidden" name="notes" value="Primeira conversa">', false)
            // E o formulario principal fica preenchido para escolher outro horario
            ->assertSee('<option value="'.$bond->id.'" selected>', false)
            ->assertSee('<option value="presencial" selected>', false)
            ->assertSee('value="'.$this->day().'"', false)
            ->assertSee('value="14:30"', false)
            ->assertSee('Primeira conversa</textarea>', false);
        $this->assertStringNotContainsString('Consulta agendada.', $page->getContent());
        $this->assertDatabaseCount('appointments', 1);
    }

    public function test_conflict_with_confirmation_records(): void
    {
        $bond = Bond::factory()->active()->create();
        $this->appointmentFor($bond, ['scheduled_at' => Carbon::parse($this->day().' 14:00', 'America/Sao_Paulo')]);

        $this->postForm($bond->psychologist->user, $this->form($bond, ['confirm_conflict' => '1']))
            ->assertRedirect(self::URL)->assertSessionHasNoErrors();
        $this->assertDatabaseCount('appointments', 2);
    }

    public function test_no_conflict_form_when_the_time_is_free(): void
    {
        $bond = Bond::factory()->active()->create();

        $this->actingAs($bond->psychologist->user)->get(self::URL)->assertOk()
            ->assertDontSee('Agendar mesmo assim')
            ->assertDontSee('name="confirm_conflict"', false);
    }

    public function test_invalid_date_or_time_returns_with_error_on_the_field(): void
    {
        $bond = Bond::factory()->active()->create();
        $user = $bond->psychologist->user;

        foreach (['2026-02-31', 'amanha', '', '10/12/2030'] as $date) {
            $this->postForm($user, $this->form($bond, ['scheduled_date' => $date]))
                ->assertRedirect(self::URL)
                ->assertSessionHasErrors('scheduled_date')
                ->assertSessionDoesntHaveErrors(['scheduled_at', 'scheduled_time']);
        }

        foreach (['25:00', '12:60', 'cedo', '', '14:30:00'] as $time) {
            $this->postForm($user, $this->form($bond, ['scheduled_time' => $time]))
                ->assertRedirect(self::URL)
                ->assertSessionHasErrors('scheduled_time')
                ->assertSessionDoesntHaveErrors(['scheduled_at', 'scheduled_date']);
        }

        $this->assertDatabaseCount('appointments', 0);

        $this->actingAs($user)->from(self::URL)->followingRedirects()
            ->post(self::URL, $this->form($bond, ['scheduled_date' => '2026-02-31']))
            ->assertOk()
            ->assertSee('Informe uma data válida.')
            ->assertSee('aria-describedby="scheduled-date-error"', false)
            ->assertSee('id="scheduled-date-error"', false);

        $this->actingAs($user)->from(self::URL)->followingRedirects()
            ->post(self::URL, $this->form($bond, ['scheduled_time' => '25:00']))
            ->assertOk()
            ->assertSee('Informe uma hora válida.')
            ->assertSee('aria-describedby="scheduled-time-error"', false)
            ->assertSee('id="scheduled-time-error"', false);
    }

    public function test_past_date_returns_with_error_linked_to_date_and_time(): void
    {
        $bond = Bond::factory()->active()->create();
        $yesterday = now()->subDay()->toDateString();

        $this->postForm($bond->psychologist->user, $this->form($bond, ['scheduled_date' => $yesterday]))
            ->assertRedirect(self::URL)->assertSessionHasErrors('scheduled_at');
        $this->assertDatabaseCount('appointments', 0);

        $this->actingAs($bond->psychologist->user)->from(self::URL)->followingRedirects()
            ->post(self::URL, $this->form($bond, ['scheduled_date' => $yesterday]))
            ->assertOk()
            ->assertSee('Escolha uma data e hora a partir de agora.')
            ->assertSee('aria-describedby="scheduled-at-error"', false)
            ->assertSee('id="scheduled-at-error"', false);
    }

    public function test_visitor_goes_to_login(): void
    {
        $bond = Bond::factory()->active()->create();

        $this->get(self::URL)->assertRedirect('/psychologist/login');
        $this->post(self::URL, $this->form($bond))->assertRedirect('/psychologist/login');
        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_patient_and_admin_cannot_access(): void
    {
        $bond = Bond::factory()->active()->create();

        foreach ([$bond->patient->user, User::factory()->admin()->create()] as $user) {
            $this->actingAs($user)->get(self::URL)->assertForbidden();
            $this->actingAs($user)->post(self::URL, $this->form($bond))->assertForbidden();
        }
        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_unapproved_psychologist_cannot_open_or_post(): void
    {
        $bond = Bond::factory()->active()->create();
        $bond->psychologist->update(['approval_status' => 'rejected']);

        $this->actingAs($bond->psychologist->user)->get(self::URL)->assertForbidden();
        $this->postForm($bond->psychologist->user, $this->form($bond))->assertForbidden();
        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_notes_with_script_are_escaped_in_the_html(): void
    {
        $bond = Bond::factory()->active()->create();
        $script = '<script>alert(1)</script>';
        $this->appointmentFor($bond, ['notes' => $script]);

        $this->actingAs($bond->psychologist->user)->get(self::URL)->assertOk()
            ->assertSee('&lt;script&gt;alert(1)&lt;/script&gt;', false)
            ->assertDontSee($script, false);

        // O texto digitado volta nos dois formularios quando ha conflito: tambem precisa sair escapado
        $this->actingAs($bond->psychologist->user)->from(self::URL)->followingRedirects()
            ->post(self::URL, $this->form($bond, ['scheduled_time' => '09:00', 'notes' => $script]))
            ->assertOk()
            ->assertSee(self::CONFLICT_MESSAGE)
            ->assertSee('name="notes" value="&lt;script&gt;alert(1)&lt;/script&gt;"', false)
            ->assertDontSee($script, false);
    }

    public function test_patient_select_only_has_own_active_bonds(): void
    {
        $own = Bond::factory()->active()->create();
        $ended = Bond::factory()->ended()->create(['psychologist_id' => $own->psychologist_id]);
        $pending = Bond::factory()->create(['psychologist_id' => $own->psychologist_id]);
        $other = Bond::factory()->active()->create();

        $this->actingAs($own->psychologist->user)->get(self::URL)->assertOk()
            ->assertSee('<option value="'.$own->id.'"', false)
            ->assertSee($own->patient->user->name)
            ->assertDontSee('<option value="'.$ended->id.'"', false)
            ->assertDontSee($ended->patient->user->name)
            ->assertDontSee('<option value="'.$pending->id.'"', false)
            ->assertDontSee($pending->patient->user->name)
            ->assertDontSee('<option value="'.$other->id.'"', false)
            ->assertDontSee($other->patient->user->name);
    }

    public function test_page_without_active_bond_explains_instead_of_showing_the_form(): void
    {
        $ended = Bond::factory()->ended()->create();

        $this->actingAs($ended->psychologist->user)->get(self::URL)->assertOk()
            ->assertSee('Você precisa de um vínculo ativo para agendar uma consulta.')
            ->assertDontSee('id="bond_id"', false);
    }

    public function test_fields_have_labels_and_navigation_links_both_ways(): void
    {
        $bond = Bond::factory()->active()->create();
        $user = $bond->psychologist->user;

        $page = $this->actingAs($user)->get(self::URL)->assertOk()
            ->assertSee('href="'.route('psychologist.tasks.index').'"', false);
        foreach (['bond_id', 'scheduled_date', 'scheduled_time', 'modality', 'notes'] as $field) {
            $page->assertSee('<label for="'.$field.'"', false)->assertSee('id="'.$field.'"', false);
        }

        $this->actingAs($user)->get('/psychologist/tasks')->assertOk()
            ->assertSee('href="'.route('psychologist.appointments.index').'"', false);
    }

    public function test_agenda_never_queries_the_reports_table(): void
    {
        $bond = Bond::factory()->active()->create();
        $this->appointmentFor($bond);

        DB::enableQueryLog();
        $this->actingAs($bond->psychologist->user)->get(self::URL)->assertOk();
        $this->postForm($bond->psychologist->user, $this->form($bond))->assertSessionHasNoErrors();

        $queries = array_column(DB::getQueryLog(), 'query');
        $this->assertNotEmpty($queries);
        // \b nao casa dentro de shared_reports, porque o sublinhado conta como letra de palavra
        $this->assertSame([], array_values(array_filter($queries, fn (string $sql) => preg_match('/\breports\b/i', $sql) === 1)));
    }
}
