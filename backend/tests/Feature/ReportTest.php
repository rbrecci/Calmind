<?php

namespace Tests\Feature;

use App\Models\Analysis;
use App\Models\AnalysisReport;
use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// Bloco E, lado do paciente: relatos com privacidade (RF-22, RF-24, DEC-13, DEC-15, CA-22.x, CA-24.x).
// O lado do psicologo (RNF-08) e provado em ReportPrivacyTest.
class ReportTest extends TestCase
{
    use RefreshDatabase;

    private const NO_CONSENT = 'É preciso aceitar o termo de uso antes de registrar relatos.';

    private const NO_BOND = 'É preciso ter um vínculo ativo para registrar relatos.';

    private const PRIVATE_TO_SHARED = 'Um relato privado não pode ser compartilhado depois. Crie um novo relato compartilhado.';

    private const SHARED_TO_PRIVATE = 'Para retirar o compartilhamento, use a despublicação.';

    private const NOT_FOUND = 'Recurso não encontrado.';

    private ConsentTerm $term;

    protected function setUp(): void
    {
        parent::setUp();

        $this->term = ConsentTerm::factory()->create();
    }

    private function bearer(User $user): array
    {
        // O guard sanctum guarda o usuario da requisicao anterior: sem isto, trocar de token no mesmo teste nao troca de usuario
        $this->app['auth']->forgetGuards();

        return ['Authorization' => 'Bearer '.$user->createToken('mobile')->plainTextToken];
    }

    /**
     * Paciente pronto para relatar: aceite do termo geral vigente e vinculo no estado pedido.
     *
     * @return array{0: User, 1: Patient, 2: ?Bond}
     */
    private function patient(bool $accepted = true, ?string $bondStatus = 'active'): array
    {
        $patient = Patient::factory()->create();

        if ($accepted) {
            ConsentAcceptance::factory()->create([
                'user_id' => $patient->user_id,
                'consent_term_id' => $this->term->id,
            ]);
        }

        $bond = $bondStatus === null ? null : Bond::factory()->create([
            'patient_id' => $patient->id,
            'status' => $bondStatus,
            'responded_at' => $bondStatus === 'pending' ? null : now(),
            'ended_at' => $bondStatus === 'ended' ? now() : null,
        ]);

        return [$patient->user, $patient, $bond];
    }

    private function resourceKeys(): array
    {
        return ['id', 'body', 'visibility', 'unpublished_at', 'created_at', 'used_in_analysis'];
    }

    // ------------------------------------------------------------- criacao

    public function test_report_defaults_to_shared_and_binds_to_the_active_bond(): void
    {
        [$user, $patient, $bond] = $this->patient();

        $response = $this->postJson('/api/v1/patient/reports', ['body' => 'Hoje foi um dia tranquilo.'], $this->bearer($user))
            ->assertCreated()
            ->assertJsonPath('body', 'Hoje foi um dia tranquilo.')
            ->assertJsonPath('visibility', 'shared')
            ->assertJsonPath('unpublished_at', null)
            ->assertJsonPath('used_in_analysis', false);

        $this->assertSame($this->resourceKeys(), array_keys($response->json()));
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/', $response->json('created_at'));
        $this->assertDatabaseHas('reports', [
            'id' => $response->json('id'),
            'bond_id' => $bond->id,
            'patient_id' => $patient->id,
            'visibility' => 'shared',
        ]);
    }

    public function test_report_can_be_created_as_private(): void
    {
        [$user] = $this->patient();

        $this->postJson('/api/v1/patient/reports', ['body' => 'Só para mim.', 'visibility' => 'private'], $this->bearer($user))
            ->assertCreated()
            ->assertJsonPath('visibility', 'private');

        $this->assertDatabaseHas('reports', ['visibility' => 'private']);
    }

    public function test_report_goes_to_the_active_bond_even_with_an_older_ended_one(): void
    {
        [$user, $patient, $active] = $this->patient();
        $ended = Bond::factory()->ended()->create(['patient_id' => $patient->id]);

        $this->postJson('/api/v1/patient/reports', ['body' => 'Novo ciclo.'], $this->bearer($user))->assertCreated();

        $this->assertDatabaseHas('reports', ['bond_id' => $active->id]);
        $this->assertDatabaseMissing('reports', ['bond_id' => $ended->id]);
    }

    public function test_patient_without_acceptance_gets_403_and_nothing_is_saved(): void
    {
        [$user] = $this->patient(accepted: false);

        $this->postJson('/api/v1/patient/reports', ['body' => 'Antes do aceite.'], $this->bearer($user))
            ->assertForbidden()
            ->assertExactJson(['message' => self::NO_CONSENT]);

        $this->assertDatabaseCount('reports', 0);
    }

    public function test_revoked_acceptance_gets_403(): void
    {
        [$user, $patient] = $this->patient(accepted: false);
        ConsentAcceptance::factory()->revoked()->create([
            'user_id' => $user->id,
            'consent_term_id' => $this->term->id,
        ]);

        $this->postJson('/api/v1/patient/reports', ['body' => 'Aceite revogado.'], $this->bearer($user))
            ->assertForbidden()
            ->assertJsonPath('message', self::NO_CONSENT);

        $this->assertDatabaseCount('reports', 0);
    }

    public function test_no_published_term_at_all_means_403(): void
    {
        [$user] = $this->patient(accepted: false);
        $this->term->delete();

        $this->postJson('/api/v1/patient/reports', ['body' => 'Sem termo publicado.'], $this->bearer($user))
            ->assertForbidden()
            ->assertJsonPath('message', self::NO_CONSENT);
    }

    public function test_acceptance_of_another_user_does_not_count(): void
    {
        [$user] = $this->patient(accepted: false);
        ConsentAcceptance::factory()->create(['consent_term_id' => $this->term->id]);

        $this->postJson('/api/v1/patient/reports', ['body' => 'Aceite alheio.'], $this->bearer($user))->assertForbidden();
    }

    public function test_newer_general_term_without_acceptance_blocks_again(): void
    {
        // CA-03.3: nova versao exige novo aceite; o aceite antigo continua registrado
        [$user] = $this->patient();
        $newer = ConsentTerm::factory()->create(['version' => '2.0', 'effective_from' => now()->subHour()]);

        $this->postJson('/api/v1/patient/reports', ['body' => 'Termo novo.'], $this->bearer($user))
            ->assertForbidden()
            ->assertJsonPath('message', self::NO_CONSENT);
        $this->assertDatabaseHas('consent_acceptances', ['user_id' => $user->id, 'consent_term_id' => $this->term->id]);

        ConsentAcceptance::factory()->create(['user_id' => $user->id, 'consent_term_id' => $newer->id]);

        $this->postJson('/api/v1/patient/reports', ['body' => 'Termo novo aceito.'], $this->bearer($user))->assertCreated();
    }

    public function test_term_not_yet_effective_and_ai_term_are_ignored(): void
    {
        [$user] = $this->patient();
        ConsentTerm::factory()->create(['version' => '2.0', 'effective_from' => now()->addDay()]);
        ConsentTerm::factory()->create(['type' => 'ai_analysis', 'version' => '9.0', 'effective_from' => now()->subHour()]);

        $this->postJson('/api/v1/patient/reports', ['body' => 'Vigente continua a 1.0.'], $this->bearer($user))->assertCreated();
    }

    public function test_patient_without_bond_gets_409(): void
    {
        [$user] = $this->patient(bondStatus: null);

        $this->postJson('/api/v1/patient/reports', ['body' => 'Sem vínculo.'], $this->bearer($user))
            ->assertStatus(409)
            ->assertExactJson(['message' => self::NO_BOND]);

        $this->assertDatabaseCount('reports', 0);
    }

    public function test_ended_and_pending_bonds_do_not_allow_reports(): void
    {
        foreach (['ended', 'pending'] as $status) {
            [$user] = $this->patient(bondStatus: $status);

            $this->postJson('/api/v1/patient/reports', ['body' => 'Vínculo '.$status], $this->bearer($user))
                ->assertStatus(409)
                ->assertJsonPath('message', self::NO_BOND);
        }

        $this->assertDatabaseCount('reports', 0);
    }

    public function test_consent_guard_comes_before_bond_guard(): void
    {
        [$user] = $this->patient(accepted: false, bondStatus: null);

        $this->postJson('/api/v1/patient/reports', ['body' => 'Nada ainda.'], $this->bearer($user))
            ->assertForbidden()
            ->assertJsonPath('message', self::NO_CONSENT);
    }

    public function test_invalid_input_gets_422_and_nothing_is_saved(): void
    {
        [$user] = $this->patient();
        $headers = $this->bearer($user);

        $this->postJson('/api/v1/patient/reports', [], $headers)
            ->assertStatus(422)->assertJsonValidationErrors('body');
        $this->postJson('/api/v1/patient/reports', ['body' => ''], $headers)
            ->assertStatus(422)->assertJsonValidationErrors('body');
        $this->postJson('/api/v1/patient/reports', ['body' => str_repeat('a', 10001)], $headers)
            ->assertStatus(422)->assertJsonValidationErrors('body');
        $this->postJson('/api/v1/patient/reports', ['body' => ['lista']], $headers)
            ->assertStatus(422)->assertJsonValidationErrors('body');
        $this->postJson('/api/v1/patient/reports', ['body' => 'ok', 'visibility' => 'public'], $headers)
            ->assertStatus(422)->assertJsonValidationErrors('visibility');

        $this->assertDatabaseCount('reports', 0);
    }

    public function test_body_at_the_limit_is_accepted(): void
    {
        [$user] = $this->patient();

        $this->postJson('/api/v1/patient/reports', ['body' => str_repeat('a', 10000)], $this->bearer($user))->assertCreated();
    }

    public function test_psychologist_and_admin_cannot_post_reports(): void
    {
        $psychologist = Psychologist::factory()->approved()->create()->user;
        $admin = User::factory()->admin()->create();

        foreach ([$psychologist, $admin] as $user) {
            $this->postJson('/api/v1/patient/reports', ['body' => 'Não sou paciente.'], $this->bearer($user))->assertForbidden();
            $this->getJson('/api/v1/patient/reports', $this->bearer($user))->assertForbidden();
        }

        $this->assertDatabaseCount('reports', 0);
    }

    // --------------------------------------------------------------- lista

    public function test_list_returns_all_own_reports_newest_first(): void
    {
        [$user, $patient, $bond] = $this->patient();
        $old = Report::factory()->forBond($bond)->create(['created_at' => now()->subDays(3)]);
        $private = Report::factory()->forBond($bond)->private()->create(['created_at' => now()->subDays(2)]);
        $unpublished = Report::factory()->forBond($bond)->unpublished()->create(['created_at' => now()->subDay()]);
        $newest = Report::factory()->forBond($bond)->create(['created_at' => now()]);

        $response = $this->getJson('/api/v1/patient/reports', $this->bearer($user))->assertOk();

        $this->assertSame([$newest->id, $unpublished->id, $private->id, $old->id], array_column($response->json('data'), 'id'));
        $this->assertSame(['total' => 4, 'page' => 1, 'per_page' => 20], $response->json('meta'));
        $this->assertSame(['data', 'meta'], array_keys($response->json()));
        $this->assertSame($this->resourceKeys(), array_keys($response->json('data.0')));
        $this->assertSame('private', $response->json('data.2.visibility'));
        $this->assertNotNull($response->json('data.1.unpublished_at'));
        $this->assertSame($old->body, $response->json('data.3.body'));
    }

    public function test_list_paginates_and_limits_per_page(): void
    {
        [$user, , $bond] = $this->patient();
        Report::factory()->forBond($bond)->count(5)->create();
        $headers = $this->bearer($user);

        $this->getJson('/api/v1/patient/reports?per_page=2&page=3', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta', ['total' => 5, 'page' => 3, 'per_page' => 2]);

        $this->getJson('/api/v1/patient/reports?per_page=50', $headers)->assertOk()->assertJsonPath('meta.per_page', 50);
        $this->getJson('/api/v1/patient/reports?per_page=51', $headers)->assertStatus(422)->assertJsonValidationErrors('per_page');
        $this->getJson('/api/v1/patient/reports?per_page=0', $headers)->assertStatus(422)->assertJsonValidationErrors('per_page');
        $this->getJson('/api/v1/patient/reports?page=0', $headers)->assertStatus(422)->assertJsonValidationErrors('page');
    }

    public function test_list_does_not_include_other_patients_reports(): void
    {
        [$userA, , $bondA] = $this->patient();
        [, , $bondB] = $this->patient();
        $mine = Report::factory()->forBond($bondA)->create();
        Report::factory()->forBond($bondB)->count(2)->create();

        $response = $this->getJson('/api/v1/patient/reports', $this->bearer($userA))->assertOk();

        $this->assertSame([$mine->id], array_column($response->json('data'), 'id'));
        $this->assertSame(1, $response->json('meta.total'));
    }

    public function test_list_keeps_reports_of_ended_bonds_for_the_owner(): void
    {
        [$user, $patient] = $this->patient(bondStatus: 'ended');
        $ended = Bond::where('patient_id', $patient->id)->firstOrFail();
        Report::factory()->forBond($ended)->count(2)->create();

        $this->getJson('/api/v1/patient/reports', $this->bearer($user))->assertOk()->assertJsonPath('meta.total', 2);
    }

    public function test_list_flags_reports_used_in_analysis_without_n_plus_one(): void
    {
        [$user, , $bond] = $this->patient();
        $used = Report::factory()->forBond($bond)->create();
        $free = Report::factory()->forBond($bond)->create();
        $this->linkToAnalysis($bond, $used);
        $headers = $this->bearer($user);

        $data = collect($this->getJson('/api/v1/patient/reports', $headers)->json('data'))->keyBy('id');
        $this->assertTrue($data[$used->id]['used_in_analysis']);
        $this->assertFalse($data[$free->id]['used_in_analysis']);

        // CA-24.2 sem N+1: mais relatos nao podem render mais consultas
        $queries = function () use ($headers): int {
            DB::flushQueryLog();
            DB::enableQueryLog();
            $this->getJson('/api/v1/patient/reports', $headers)->assertOk();

            return count(DB::getQueryLog());
        };
        $few = $queries();
        Report::factory()->forBond($bond)->count(10)->create();
        $this->assertSame($few, $queries());
    }

    // ------------------------------------------------------ isolamento entre pacientes

    public function test_patient_cannot_see_edit_or_unpublish_another_patients_report(): void
    {
        [$userA] = $this->patient();
        [, , $bondB] = $this->patient();
        $theirs = Report::factory()->forBond($bondB)->create();
        $headers = $this->bearer($userA);

        $this->patchJson("/api/v1/patient/reports/{$theirs->id}", ['visibility' => 'shared'], $headers)
            ->assertNotFound()->assertExactJson(['message' => self::NOT_FOUND]);
        $this->patchJson("/api/v1/patient/reports/{$theirs->id}", ['visibility' => 'private'], $headers)
            ->assertNotFound()->assertExactJson(['message' => self::NOT_FOUND]);
        $this->postJson("/api/v1/patient/reports/{$theirs->id}/unpublish", [], $headers)
            ->assertNotFound()->assertExactJson(['message' => self::NOT_FOUND]);

        $this->assertNull($theirs->fresh()->unpublished_at);
        $this->assertNotContains($theirs->id, array_column($this->getJson('/api/v1/patient/reports', $headers)->json('data'), 'id'));
    }

    public function test_unknown_report_id_gets_404(): void
    {
        [$user] = $this->patient();
        $headers = $this->bearer($user);

        $this->patchJson('/api/v1/patient/reports/999999', ['visibility' => 'shared'], $headers)->assertNotFound();
        $this->postJson('/api/v1/patient/reports/999999/unpublish', [], $headers)->assertNotFound();
        $this->postJson('/api/v1/patient/reports/abc/unpublish', [], $headers)->assertNotFound();
    }

    // ------------------------------------------------------------------ PATCH

    public function test_private_report_cannot_become_shared(): void
    {
        // CA-22.3
        [$user, , $bond] = $this->patient();
        $report = Report::factory()->forBond($bond)->private()->create();

        $this->patchJson("/api/v1/patient/reports/{$report->id}", ['visibility' => 'shared'], $this->bearer($user))
            ->assertStatus(422)
            ->assertJsonPath('errors.visibility', [self::PRIVATE_TO_SHARED]);

        $this->assertSame('private', $report->fresh()->visibility);
    }

    public function test_shared_report_cannot_be_made_private_by_patch(): void
    {
        [$user, , $bond] = $this->patient();
        $report = Report::factory()->forBond($bond)->create();

        $this->patchJson("/api/v1/patient/reports/{$report->id}", ['visibility' => 'private'], $this->bearer($user))
            ->assertStatus(422)
            ->assertJsonPath('errors.visibility', [self::SHARED_TO_PRIVATE]);

        $this->assertSame('shared', $report->fresh()->visibility);
    }

    public function test_patch_with_the_current_value_changes_nothing(): void
    {
        [$user, , $bond] = $this->patient();
        $shared = Report::factory()->forBond($bond)->create();
        $private = Report::factory()->forBond($bond)->private()->create();
        $headers = $this->bearer($user);

        $this->patchJson("/api/v1/patient/reports/{$shared->id}", ['visibility' => 'shared'], $headers)
            ->assertOk()
            ->assertJsonPath('id', $shared->id)
            ->assertJsonPath('visibility', 'shared');
        $this->patchJson("/api/v1/patient/reports/{$private->id}", ['visibility' => 'private'], $headers)
            ->assertOk()
            ->assertJsonPath('visibility', 'private');

        $this->assertNull($shared->fresh()->unpublished_at);
    }

    public function test_patch_validates_visibility(): void
    {
        [$user, , $bond] = $this->patient();
        $report = Report::factory()->forBond($bond)->create();
        $headers = $this->bearer($user);

        $this->patchJson("/api/v1/patient/reports/{$report->id}", [], $headers)
            ->assertStatus(422)->assertJsonValidationErrors('visibility');
        $this->patchJson("/api/v1/patient/reports/{$report->id}", ['visibility' => 'public'], $headers)
            ->assertStatus(422)->assertJsonValidationErrors('visibility');
    }

    // -------------------------------------------------------------- despublicar

    public function test_unpublish_marks_the_report_and_keeps_the_shape(): void
    {
        [$user, , $bond] = $this->patient();
        $report = Report::factory()->forBond($bond)->create();

        $response = $this->postJson("/api/v1/patient/reports/{$report->id}/unpublish", [], $this->bearer($user))
            ->assertOk()
            ->assertJsonPath('id', $report->id)
            ->assertJsonPath('visibility', 'shared')
            ->assertJsonPath('used_in_analysis', false);

        $this->assertSame($this->resourceKeys(), array_keys($response->json()));
        $this->assertNotNull($response->json('unpublished_at'));
        $this->assertNotNull($report->fresh()->unpublished_at);
        // O relato continua do paciente: some da visao do psicologo, nao da dele
        $this->assertDatabaseHas('reports', ['id' => $report->id]);
    }

    public function test_unpublish_is_idempotent_and_keeps_the_first_timestamp(): void
    {
        [$user, , $bond] = $this->patient();
        $report = Report::factory()->forBond($bond)->create();
        $headers = $this->bearer($user);
        $this->freezeTime();

        $first = $this->postJson("/api/v1/patient/reports/{$report->id}/unpublish", [], $headers)->assertOk();
        $this->travel(10)->minutes();
        $second = $this->postJson("/api/v1/patient/reports/{$report->id}/unpublish", [], $headers)->assertOk();

        $this->assertSame($first->json('unpublished_at'), $second->json('unpublished_at'));
    }

    public function test_private_report_cannot_be_unpublished(): void
    {
        [$user, , $bond] = $this->patient();
        $report = Report::factory()->forBond($bond)->private()->create();

        $this->postJson("/api/v1/patient/reports/{$report->id}/unpublish", [], $this->bearer($user))
            ->assertStatus(409)
            ->assertExactJson(['message' => 'Este relato é privado e não está compartilhado.']);

        $this->assertNull($report->fresh()->unpublished_at);
    }

    public function test_unpublish_reports_when_the_report_was_used_in_analysis(): void
    {
        // CA-24.2: o app avisa antes da confirmacao; a despublicacao nao apaga a linha da analise
        [$user, , $bond] = $this->patient();
        $report = Report::factory()->forBond($bond)->create();
        $this->linkToAnalysis($bond, $report);

        $this->postJson("/api/v1/patient/reports/{$report->id}/unpublish", [], $this->bearer($user))
            ->assertOk()
            ->assertJsonPath('used_in_analysis', true);

        $this->assertDatabaseHas('analysis_reports', ['report_id' => $report->id]);
    }

    // ------------------------------------------------------------------- 401

    public function test_every_report_route_requires_a_token(): void
    {
        $this->postJson('/api/v1/patient/reports', ['body' => 'x'])->assertUnauthorized();
        $this->getJson('/api/v1/patient/reports')->assertUnauthorized();
        $this->patchJson('/api/v1/patient/reports/1', ['visibility' => 'shared'])->assertUnauthorized();
        $this->postJson('/api/v1/patient/reports/1/unpublish')->assertUnauthorized();
        $this->getJson('/api/v1/psychologist/patients/1/reports')->assertUnauthorized();
        $this->getJson('/api/v1/psychologist/reports/1')->assertUnauthorized();
    }

    private function linkToAnalysis(Bond $bond, Report $report): void
    {
        $requester = Psychologist::findOrFail($bond->psychologist_id)->user_id;
        $analysis = Analysis::create([
            'bond_id' => $bond->id,
            'requested_by_user_id' => $requester,
            'period_start' => now()->subWeek()->toDateString(),
            'period_end' => now()->toDateString(),
        ]);
        AnalysisReport::create(['analysis_id' => $analysis->id, 'report_id' => $report->id]);
    }
}
