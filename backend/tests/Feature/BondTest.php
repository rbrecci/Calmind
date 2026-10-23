<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\Invitation;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\User;
use App\Services\InvitationService;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

// Bloco D: convite e vinculo (RF-06 a RF-13, RNF-05, RNF-06, RNF-50, RNF-53)
class BondTest extends TestCase
{
    use RefreshDatabase;

    private const NOT_APPROVED = 'Seu cadastro profissional ainda não foi aprovado.';

    private const INVALID_CODE = 'Código de convite inválido ou expirado.';

    private const INVITATION_CONSUMED = 'Este convite já gerou um vínculo. Para encerrar o acompanhamento, encerre o vínculo.';

    private const ACTIVE_BOND = 'Você já tem um vínculo ativo. Encerre o vínculo atual antes de usar um novo código.';

    private const PENDING_REQUEST = 'Você já tem uma solicitação pendente.';

    private const NOT_PENDING = 'Esta solicitação não está mais pendente.';

    private const PATIENT_HAS_ACTIVE_BOND = 'O paciente já possui um vínculo ativo.';

    private const CATALOG_BLOCKED = 'A busca por profissionais é liberada depois que o vínculo atual for encerrado.';

    private const CANNOT_END = 'Este vínculo já está encerrado ou ainda não foi aceito.';

    private const UNAVAILABLE = 'Profissional indisponível.';

    private const REDEEM = '/api/v1/patient/bonds/redeem-invitation';

    private const REQUEST_BOND = '/api/v1/patient/bonds/requests';

    private const CATALOG = '/api/v1/catalog/psychologists';

    // ------------------------------------------------------------------ apoio

    // Troca o usuario autenticado: sem forgetGuards o guard do Sanctum guarda o usuario da chamada anterior
    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    private function patient(): Patient
    {
        return Patient::factory()->create();
    }

    private function psychologist(array $profile = []): Psychologist
    {
        return Psychologist::factory()->published()->create($profile);
    }

    private function pendingBond(Patient $patient, Psychologist $psychologist): Bond
    {
        return Bond::factory()->create(['patient_id' => $patient->id, 'psychologist_id' => $psychologist->id]);
    }

    private function activeBond(?Patient $patient = null, ?Psychologist $psychologist = null): Bond
    {
        return Bond::factory()->active()->create([
            'patient_id' => ($patient ?? $this->patient())->id,
            'psychologist_id' => ($psychologist ?? $this->psychologist())->id,
        ]);
    }

    // ------------------------------------------------------- gerar convite (RF-06)

    public function test_approved_psychologist_generates_invitation_with_seven_day_expiry(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $psychologist = $this->psychologist();

        $response = $this->as($psychologist->user)->postJson('/api/v1/psychologist/invitations')->assertCreated();

        $this->assertSame(['id', 'code', 'expires_at', 'created_at'], array_keys($response->json()));
        $this->assertMatchesRegularExpression('/^[A-HJ-NP-Z2-9]{8}$/', $response->json('code'));
        $response->assertJsonPath('expires_at', '2026-10-28T10:00:00-03:00')
            ->assertJsonPath('created_at', '2026-10-21T10:00:00-03:00');
        $this->assertDatabaseHas('invitations', [
            'id' => $response->json('id'),
            'psychologist_id' => $psychologist->id,
            'code' => $response->json('code'),
            'consumed_at' => null,
            'revoked_at' => null,
        ]);
    }

    public function test_three_hundred_codes_are_distinct_unambiguous_and_eight_chars(): void
    {
        $service = app(InvitationService::class);
        $user = $this->psychologist()->user;

        $codes = [];
        for ($i = 0; $i < 300; $i++) {
            $codes[] = $service->generate($user)->code;
        }

        $this->assertCount(300, array_unique($codes));
        foreach ($codes as $code) {
            $this->assertSame(8, strlen($code));
            $this->assertDoesNotMatchRegularExpression('/[0O1Il]/', $code);
        }
    }

    public function test_psychologist_with_pending_or_rejected_approval_cannot_generate(): void
    {
        foreach (['pending', 'rejected'] as $status) {
            $psychologist = Psychologist::factory()->create(['approval_status' => $status]);

            $this->as($psychologist->user)->postJson('/api/v1/psychologist/invitations')
                ->assertForbidden()
                ->assertExactJson(['message' => self::NOT_APPROVED]);
        }

        $this->assertDatabaseCount('invitations', 0);
    }

    public function test_psychologist_account_without_psychologist_row_cannot_generate(): void
    {
        $user = User::factory()->psychologist()->create();

        $this->as($user)->postJson('/api/v1/psychologist/invitations')
            ->assertForbidden()
            ->assertExactJson(['message' => self::NOT_APPROVED]);
        $this->assertDatabaseCount('invitations', 0);
    }

    public function test_patient_cannot_generate_invitation(): void
    {
        $this->as($this->patient()->user)->postJson('/api/v1/psychologist/invitations')->assertForbidden();
        $this->assertDatabaseCount('invitations', 0);
    }

    // ------------------------------------------------------ revogar convite (RF-08)

    public function test_psychologist_revokes_own_invitation(): void
    {
        $invitation = Invitation::factory()->create();

        $response = $this->as($invitation->psychologist->user)
            ->deleteJson("/api/v1/psychologist/invitations/{$invitation->id}")
            ->assertOk();

        $this->assertSame(['id', 'code', 'expires_at', 'revoked_at'], array_keys($response->json()));
        $response->assertJsonPath('id', $invitation->id)->assertJsonPath('code', $invitation->code);
        $this->assertNotNull($response->json('revoked_at'));
        $this->assertNotNull($invitation->fresh()->revoked_at);
    }

    public function test_revoking_twice_is_idempotent_and_keeps_the_first_revoked_at(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $invitation = Invitation::factory()->create();
        $user = $invitation->psychologist->user;

        $first = $this->as($user)->deleteJson("/api/v1/psychologist/invitations/{$invitation->id}")->assertOk();
        $this->travel(1)->hours();
        $second = $this->as($user)->deleteJson("/api/v1/psychologist/invitations/{$invitation->id}")->assertOk();

        $this->assertSame($first->json('revoked_at'), $second->json('revoked_at'));
        $this->assertSame('2026-10-21T10:00:00-03:00', $second->json('revoked_at'));
    }

    public function test_cannot_revoke_invitation_of_another_psychologist_or_missing_one(): void
    {
        $invitation = Invitation::factory()->create();
        $other = $this->psychologist();

        $this->as($other->user)->deleteJson("/api/v1/psychologist/invitations/{$invitation->id}")->assertNotFound();
        $this->as($other->user)->deleteJson('/api/v1/psychologist/invitations/999999')->assertNotFound();
        $this->assertNull($invitation->fresh()->revoked_at);

        // controle positivo: o dono revoga, entao o 404 acima veio da regra e nao de rota ausente
        $this->as($invitation->psychologist->user)->deleteJson("/api/v1/psychologist/invitations/{$invitation->id}")->assertOk();
    }

    public function test_cannot_revoke_consumed_invitation(): void
    {
        $invitation = Invitation::factory()->consumed()->create();

        $this->as($invitation->psychologist->user)
            ->deleteJson("/api/v1/psychologist/invitations/{$invitation->id}")
            ->assertStatus(409)
            ->assertExactJson(['message' => self::INVITATION_CONSUMED]);
        $this->assertNull($invitation->fresh()->revoked_at);
    }

    // ----------------------------------------------- ingressar por convite (RF-07)

    public function test_patient_redeems_valid_code_and_gets_active_bond(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $invitation = Invitation::factory()->create();
        $patient = $this->patient();

        $response = $this->as($patient->user)->postJson(self::REDEEM, ['code' => $invitation->code])->assertCreated();

        $this->assertSame(
            ['id', 'status', 'origin', 'psychologist_id', 'patient_user_id', 'requested_at', 'responded_at', 'ended_at'],
            array_keys($response->json())
        );
        $response->assertJsonPath('status', 'active')
            ->assertJsonPath('origin', 'invitation')
            ->assertJsonPath('psychologist_id', $invitation->psychologist_id)
            ->assertJsonPath('patient_user_id', $patient->user_id)
            ->assertJsonPath('requested_at', '2026-10-21T10:00:00-03:00')
            ->assertJsonPath('responded_at', '2026-10-21T10:00:00-03:00')
            ->assertJsonPath('ended_at', null);
        $this->assertDatabaseHas('bonds', [
            'id' => $response->json('id'),
            'patient_id' => $patient->id,
            'status' => 'active',
            'origin' => 'invitation',
            'invitation_id' => $invitation->id,
        ]);
        $invitation->refresh();
        $this->assertNotNull($invitation->consumed_at);
        $this->assertSame($patient->id, $invitation->consumed_by_patient_id);
    }

    public function test_code_is_normalized_before_lookup(): void
    {
        $invitation = Invitation::factory()->create();

        $this->as($this->patient()->user)
            ->postJson(self::REDEEM, ['code' => '  '.strtolower($invitation->code).' '])
            ->assertCreated();
    }

    public function test_invalid_codes_all_get_the_same_422_without_naming_the_psychologist(): void
    {
        $psychologist = $this->psychologist();
        $psychologist->user->update(['name' => 'Psicóloga Secreta']);
        $codes = [
            'expired' => Invitation::factory()->expired()->create(['psychologist_id' => $psychologist->id])->code,
            'revoked' => Invitation::factory()->revoked()->create(['psychologist_id' => $psychologist->id])->code,
            'consumed' => Invitation::factory()->consumed()->create(['psychologist_id' => $psychologist->id])->code,
            'missing' => 'ZZZZZZ',
        ];

        $bodies = [];
        foreach ($codes as $kind => $code) {
            $response = $this->as($this->patient()->user)->postJson(self::REDEEM, ['code' => $code])
                ->assertStatus(422)
                ->assertJsonPath('errors.code', [self::INVALID_CODE]);
            $bodies[$kind] = $response->getContent();
            $this->assertStringNotContainsString('Secreta', $bodies[$kind]);
        }

        $this->assertCount(1, array_unique($bodies), 'os quatro motivos precisam devolver o mesmo corpo');
        $this->assertDatabaseCount('bonds', 0);
    }

    public function test_reusing_a_consumed_code_is_422_even_for_who_now_has_an_active_bond(): void
    {
        $invitation = Invitation::factory()->create();
        $patient = $this->patient();

        $this->as($patient->user)->postJson(self::REDEEM, ['code' => $invitation->code])->assertCreated();
        $this->as($patient->user)->postJson(self::REDEEM, ['code' => $invitation->code])
            ->assertStatus(422)
            ->assertJsonPath('errors.code', [self::INVALID_CODE]);
        $this->assertDatabaseCount('bonds', 1);
    }

    public function test_patient_with_active_bond_and_valid_code_gets_409_and_code_stays_usable(): void
    {
        $patient = $this->patient();
        $this->activeBond($patient);
        $invitation = Invitation::factory()->create();

        $this->as($patient->user)->postJson(self::REDEEM, ['code' => $invitation->code])
            ->assertStatus(409)
            ->assertExactJson(['message' => self::ACTIVE_BOND]);

        $this->assertNull($invitation->fresh()->consumed_at);
        $this->assertDatabaseCount('bonds', 1);
    }

    public function test_unique_index_violation_on_redeem_becomes_409_without_partial_effect(): void
    {
        $patient = $this->patient();
        $invitation = Invitation::factory()->create();
        $other = $this->psychologist();

        // Simula a corrida: entre a checagem e o insert, outro caminho cria o vinculo ativo do paciente
        Bond::creating(function (Bond $bond) use ($other) {
            if ($bond->origin === 'invitation') {
                DB::table('bonds')->insert([
                    'patient_id' => $bond->patient_id,
                    'psychologist_id' => $other->id,
                    'status' => 'active',
                    'origin' => 'catalog',
                ]);
            }
        });

        $this->as($patient->user)->postJson(self::REDEEM, ['code' => $invitation->code])
            ->assertStatus(409)
            ->assertExactJson(['message' => self::ACTIVE_BOND]);

        $this->assertNull($invitation->fresh()->consumed_at);
        $this->assertDatabaseCount('bonds', 0);
    }

    public function test_psychologist_cannot_redeem(): void
    {
        $invitation = Invitation::factory()->create();

        $this->as($this->psychologist()->user)->postJson(self::REDEEM, ['code' => $invitation->code])->assertForbidden();
    }

    // -------------------------------------- limite de tentativas (RNF-06, DA-08)

    public function test_sixth_call_after_five_failures_is_429_with_audit_and_recovers_after_window(): void
    {
        $patient = $this->patient();
        $invitation = Invitation::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $this->as($patient->user)->postJson(self::REDEEM, ['code' => 'ZZZZZZZ'.$i])->assertStatus(422);
        }
        $this->assertDatabaseCount('audit_logs', 0);

        // ate o codigo valido e barrado enquanto durar o bloqueio
        $blocked = $this->as($patient->user)->postJson(self::REDEEM, ['code' => $invitation->code])
            ->assertStatus(429)
            ->assertJsonMissingPath('errors');
        $this->assertGreaterThan(0, (int) $blocked->headers->get('Retry-After'));
        $this->assertNull($invitation->fresh()->consumed_at);
        $this->assertDatabaseCount('bonds', 0);

        $this->assertDatabaseCount('audit_logs', 1);
        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $patient->user_id,
            'action' => 'redeem_invitation_blocked',
            'resource_type' => 'invitation',
            'resource_id' => null,
            'result' => 'denied',
        ]);

        $this->travel(16)->minutes();

        $this->as($patient->user)->postJson(self::REDEEM, ['code' => $invitation->code])->assertCreated();
    }

    public function test_block_of_one_user_does_not_block_another_user(): void
    {
        $blockedPatient = $this->patient();
        for ($i = 0; $i < 5; $i++) {
            $this->as($blockedPatient->user)->postJson(self::REDEEM, ['code' => 'ZZZZZZZ'.$i])->assertStatus(422);
        }
        $this->as($blockedPatient->user)->postJson(self::REDEEM, ['code' => 'ZZZZZZZZ'])->assertStatus(429);

        $invitation = Invitation::factory()->create();
        $this->as($this->patient()->user)->postJson(self::REDEEM, ['code' => $invitation->code])->assertCreated();
    }

    public function test_successful_redeem_resets_the_failure_counter(): void
    {
        $patient = $this->patient();
        $first = Invitation::factory()->create();
        $second = Invitation::factory()->create();

        for ($i = 0; $i < 4; $i++) {
            $this->as($patient->user)->postJson(self::REDEEM, ['code' => 'ZZZZZZZ'.$i])->assertStatus(422);
        }
        $bondId = $this->as($patient->user)->postJson(self::REDEEM, ['code' => $first->code])
            ->assertCreated()->json('id');
        $this->as($patient->user)->postJson("/api/v1/bonds/{$bondId}/end")->assertOk();

        // sem o reset, estas quatro somariam 8 falhas e a chamada final seria 429
        for ($i = 0; $i < 4; $i++) {
            $this->as($patient->user)->postJson(self::REDEEM, ['code' => 'YYYYYYY'.$i])->assertStatus(422);
        }
        $this->as($patient->user)->postJson(self::REDEEM, ['code' => $second->code])->assertCreated();
    }

    public function test_redeem_with_active_bond_does_not_count_as_failed_attempt(): void
    {
        $patient = $this->patient();
        $this->activeBond($patient);
        $invitation = Invitation::factory()->create();

        for ($i = 0; $i < 6; $i++) {
            $this->as($patient->user)->postJson(self::REDEEM, ['code' => $invitation->code])->assertStatus(409);
        }
    }

    // ------------------------------------------------- solicitar vinculo (RF-10)

    public function test_patient_requests_bond_with_published_psychologist(): void
    {
        $psychologist = $this->psychologist();
        $patient = $this->patient();

        $response = $this->as($patient->user)->postJson(self::REQUEST_BOND, ['psychologist_id' => $psychologist->id])
            ->assertCreated()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('origin', 'catalog')
            ->assertJsonPath('psychologist_id', $psychologist->id)
            ->assertJsonPath('patient_user_id', $patient->user_id)
            ->assertJsonPath('responded_at', null);

        $this->assertDatabaseHas('bonds', ['id' => $response->json('id'), 'status' => 'pending', 'origin' => 'catalog']);
    }

    public function test_unavailable_psychologists_get_the_same_422(): void
    {
        $patient = $this->patient();
        $suspended = $this->psychologist();
        $suspended->user->update(['status' => 'suspended']);
        $targets = [
            'unpublished' => Psychologist::factory()->approved()->create()->id,
            'pending' => Psychologist::factory()->create(['profile_published_at' => now()])->id,
            'rejected' => Psychologist::factory()->create(['approval_status' => 'rejected', 'profile_published_at' => now()])->id,
            'suspended' => $suspended->id,
            'missing' => 999999,
        ];

        $bodies = [];
        foreach ($targets as $kind => $id) {
            $bodies[$kind] = $this->as($patient->user)->postJson(self::REQUEST_BOND, ['psychologist_id' => $id])
                ->assertStatus(422)
                ->assertJsonPath('errors.psychologist_id', [self::UNAVAILABLE])
                ->getContent();
        }

        $this->assertCount(1, array_unique($bodies));
        $this->assertDatabaseCount('bonds', 0);
    }

    public function test_request_requires_psychologist_id(): void
    {
        $this->as($this->patient()->user)->postJson(self::REQUEST_BOND, [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('psychologist_id');
    }

    public function test_patient_with_active_bond_cannot_request_another(): void
    {
        $patient = $this->patient();
        $this->activeBond($patient);

        $this->as($patient->user)->postJson(self::REQUEST_BOND, ['psychologist_id' => $this->psychologist()->id])
            ->assertStatus(409)
            ->assertExactJson(['message' => self::ACTIVE_BOND]);
        $this->assertDatabaseCount('bonds', 1);
    }

    public function test_patient_with_pending_request_cannot_request_any_psychologist(): void
    {
        $patient = $this->patient();
        $first = $this->psychologist();
        $this->pendingBond($patient, $first);

        foreach ([$first, $this->psychologist()] as $psychologist) {
            $this->as($patient->user)->postJson(self::REQUEST_BOND, ['psychologist_id' => $psychologist->id])
                ->assertStatus(409)
                ->assertExactJson(['message' => self::PENDING_REQUEST]);
        }
        $this->assertDatabaseCount('bonds', 1);
    }

    public function test_patient_with_ended_bond_can_request_again(): void
    {
        $patient = $this->patient();
        Bond::factory()->ended()->create(['patient_id' => $patient->id]);

        $this->as($patient->user)->postJson(self::REQUEST_BOND, ['psychologist_id' => $this->psychologist()->id])
            ->assertCreated();
    }

    // ---------------------------------------------- aceitar e recusar (RF-11)

    public function test_psychologist_accepts_pending_request(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $psychologist = $this->psychologist();
        $patient = $this->patient();
        $bond = $this->pendingBond($patient, $psychologist);

        $this->travel(2)->hours();
        $this->as($psychologist->user)->postJson("/api/v1/psychologist/bond-requests/{$bond->id}/accept")
            ->assertOk()
            ->assertJsonPath('id', $bond->id)
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('responded_at', '2026-10-21T12:00:00-03:00');

        $this->assertDatabaseHas('bonds', ['id' => $bond->id, 'status' => 'active']);
        $this->assertNotNull($bond->fresh()->responded_at);
    }

    public function test_psychologist_accepts_without_ceiling_of_patients(): void
    {
        $psychologist = $this->psychologist();
        $this->activeBond(null, $psychologist);
        $bond = $this->pendingBond($this->patient(), $psychologist);

        $this->as($psychologist->user)->postJson("/api/v1/psychologist/bond-requests/{$bond->id}/accept")->assertOk();
    }

    public function test_cannot_answer_request_of_another_psychologist_or_missing_one(): void
    {
        $bond = $this->pendingBond($this->patient(), $this->psychologist());
        $other = $this->psychologist();

        foreach (['accept', 'reject'] as $action) {
            $this->as($other->user)->postJson("/api/v1/psychologist/bond-requests/{$bond->id}/{$action}")->assertNotFound();
            $this->as($other->user)->postJson("/api/v1/psychologist/bond-requests/999999/{$action}")->assertNotFound();
        }
        $this->assertSame('pending', $bond->fresh()->status);

        // controle positivo: o dono responde, entao o 404 acima veio da regra e nao de rota ausente
        $this->as($bond->psychologist->user)->postJson("/api/v1/psychologist/bond-requests/{$bond->id}/reject")->assertOk();
    }

    public function test_cannot_answer_a_request_that_is_not_pending(): void
    {
        $psychologist = $this->psychologist();
        $active = $this->activeBond(null, $psychologist);
        $ended = Bond::factory()->ended()->create(['psychologist_id' => $psychologist->id]);

        foreach ([$active, $ended] as $bond) {
            foreach (['accept', 'reject'] as $action) {
                $this->as($psychologist->user)->postJson("/api/v1/psychologist/bond-requests/{$bond->id}/{$action}")
                    ->assertStatus(409)
                    ->assertExactJson(['message' => self::NOT_PENDING]);
            }
        }
        $this->assertSame('active', $active->fresh()->status);
        $this->assertSame('ended', $ended->fresh()->status);
    }

    public function test_accepting_twice_the_second_is_409(): void
    {
        $psychologist = $this->psychologist();
        $bond = $this->pendingBond($this->patient(), $psychologist);

        $this->as($psychologist->user)->postJson("/api/v1/psychologist/bond-requests/{$bond->id}/accept")->assertOk();
        $this->as($psychologist->user)->postJson("/api/v1/psychologist/bond-requests/{$bond->id}/accept")
            ->assertStatus(409);
    }

    public function test_accept_when_patient_got_another_active_bond_meanwhile_is_409_without_partial_effect(): void
    {
        $patient = $this->patient();
        $psychologist = $this->psychologist();
        $bond = $this->pendingBond($patient, $psychologist);
        // o paciente entrou por convite com outro profissional enquanto a solicitacao esperava
        $existing = $this->activeBond($patient);

        $this->as($psychologist->user)->postJson("/api/v1/psychologist/bond-requests/{$bond->id}/accept")
            ->assertStatus(409)
            ->assertExactJson(['message' => self::PATIENT_HAS_ACTIVE_BOND]);

        $this->assertDatabaseHas('bonds', ['id' => $bond->id, 'status' => 'pending', 'responded_at' => null]);
        $this->assertSame('active', $existing->fresh()->status);
        $this->assertSame(1, Bond::where('patient_id', $patient->id)->where('status', 'active')->count());
    }

    public function test_psychologist_rejects_pending_request(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $psychologist = $this->psychologist();
        $patient = $this->patient();
        $bond = $this->pendingBond($patient, $psychologist);

        $this->as($psychologist->user)->postJson("/api/v1/psychologist/bond-requests/{$bond->id}/reject")
            ->assertOk()
            ->assertJsonPath('status', 'ended')
            ->assertJsonPath('responded_at', '2026-10-21T10:00:00-03:00')
            ->assertJsonPath('ended_at', '2026-10-21T10:00:00-03:00');

        $this->assertDatabaseHas('bonds', ['id' => $bond->id, 'status' => 'ended', 'ended_by_user_id' => $psychologist->user_id]);

        // CA-11.2: o catalogo segue acessivel e o paciente pode pedir de novo
        $this->as($patient->user)->getJson(self::CATALOG)->assertOk();
    }

    public function test_patient_cannot_answer_requests(): void
    {
        $bond = $this->pendingBond($this->patient(), $this->psychologist());

        $this->as($bond->patient->user)->postJson("/api/v1/psychologist/bond-requests/{$bond->id}/accept")->assertForbidden();
        $this->as($bond->patient->user)->postJson("/api/v1/psychologist/bond-requests/{$bond->id}/reject")->assertForbidden();
    }

    // ------------------------------------------------------ encerrar (RF-13)

    public function test_patient_ends_active_bond_and_catalog_opens_again(): void
    {
        $this->travelTo(Carbon::parse('2026-10-21 10:00:00'));
        $patient = $this->patient();
        $bond = $this->activeBond($patient);

        $this->as($patient->user)->getJson(self::CATALOG)->assertForbidden();

        $this->as($patient->user)->postJson("/api/v1/bonds/{$bond->id}/end")
            ->assertOk()
            ->assertJsonPath('status', 'ended')
            ->assertJsonPath('ended_at', '2026-10-21T10:00:00-03:00');
        $this->assertDatabaseHas('bonds', ['id' => $bond->id, 'status' => 'ended', 'ended_by_user_id' => $patient->user_id]);

        $this->as($patient->user)->getJson(self::CATALOG)->assertOk();
    }

    public function test_psychologist_ends_active_bond(): void
    {
        $psychologist = $this->psychologist();
        $bond = $this->activeBond(null, $psychologist);

        $this->as($psychologist->user)->postJson("/api/v1/bonds/{$bond->id}/end")
            ->assertOk()
            ->assertJsonPath('status', 'ended');
        $this->assertDatabaseHas('bonds', ['id' => $bond->id, 'ended_by_user_id' => $psychologist->user_id]);
    }

    public function test_third_parties_and_missing_ids_get_404_when_ending(): void
    {
        $bond = $this->activeBond();
        $strangers = [$this->patient()->user, $this->psychologist()->user];

        foreach ($strangers as $stranger) {
            $this->as($stranger)->postJson("/api/v1/bonds/{$bond->id}/end")->assertNotFound();
        }
        $this->as($bond->patient->user)->postJson('/api/v1/bonds/999999/end')->assertNotFound();
        $this->assertSame('active', $bond->fresh()->status);

        // controle positivo: o participante encerra, entao o 404 acima veio da regra e nao de rota ausente
        $this->as($bond->patient->user)->postJson("/api/v1/bonds/{$bond->id}/end")->assertOk();
    }

    public function test_admin_cannot_end_a_bond(): void
    {
        $bond = $this->activeBond();

        $this->as(User::factory()->admin()->create())->postJson("/api/v1/bonds/{$bond->id}/end")->assertForbidden();
    }

    public function test_cannot_end_a_bond_that_is_pending_or_already_ended(): void
    {
        $patient = $this->patient();
        $pending = $this->pendingBond($patient, $this->psychologist());
        $ended = Bond::factory()->ended()->create(['patient_id' => $patient->id]);

        foreach ([$pending, $ended] as $bond) {
            $this->as($patient->user)->postJson("/api/v1/bonds/{$bond->id}/end")
                ->assertStatus(409)
                ->assertExactJson(['message' => self::CANNOT_END]);
        }
        $this->assertSame('pending', $pending->fresh()->status);
    }

    // ------------------------------------------------------ catalogo (RF-09)

    public function test_catalog_lists_only_approved_published_and_active_users(): void
    {
        $listed = $this->psychologist();
        Psychologist::factory()->approved()->create();
        Psychologist::factory()->create(['profile_published_at' => now()]);
        Psychologist::factory()->create(['approval_status' => 'rejected', 'profile_published_at' => now()]);
        $this->psychologist()->user->update(['status' => 'suspended']);

        $response = $this->as($this->patient()->user)->getJson(self::CATALOG)->assertOk();

        $this->assertSame([$listed->id], array_column($response->json('data'), 'id'));
    }

    public function test_catalog_item_has_only_the_public_profile_fields(): void
    {
        $psychologist = $this->psychologist([
            'crp_region' => '06',
            'crp_number' => '123456',
            'profile_approach' => 'TCC',
            'profile_specialty' => 'Ansiedade',
            'profile_modality' => 'online',
            'profile_region' => 'São Paulo, SP',
            'profile_bio' => 'Texto escrito pelo profissional.',
        ]);

        $item = $this->as($this->patient()->user)->getJson(self::CATALOG)->assertOk()->json('data.0');

        $this->assertSame(['id', 'name', 'crp', 'approach', 'specialty', 'modality', 'region', 'bio'], array_keys($item));
        $this->assertSame([
            'id' => $psychologist->id,
            'name' => $psychologist->user->name,
            'crp' => '06/123456',
            'approach' => 'TCC',
            'specialty' => 'Ansiedade',
            'modality' => 'online',
            'region' => 'São Paulo, SP',
            'bio' => 'Texto escrito pelo profissional.',
        ], $item);
    }

    public function test_catalog_json_has_no_price_rating_or_ranking_keys(): void
    {
        $this->psychologist();

        $content = strtolower($this->as($this->patient()->user)->getJson(self::CATALOG)->assertOk()->getContent());

        foreach (['price', 'rating', 'score', 'reviews', 'preco', 'nota', 'rank', 'estrela', 'avalia', 'honorario'] as $forbidden) {
            $this->assertStringNotContainsString('"'.$forbidden, $content);
        }
    }

    public function test_catalog_is_denied_with_active_bond(): void
    {
        $patient = $this->patient();
        $this->activeBond($patient);

        $this->as($patient->user)->getJson(self::CATALOG)
            ->assertForbidden()
            ->assertExactJson(['message' => self::CATALOG_BLOCKED]);
    }

    public function test_catalog_stays_open_with_pending_or_ended_bonds(): void
    {
        $patient = $this->patient();
        $this->pendingBond($patient, $this->psychologist());
        Bond::factory()->ended()->create(['patient_id' => $patient->id]);

        $this->as($patient->user)->getJson(self::CATALOG)->assertOk();
    }

    public function test_catalog_is_ordered_by_name_and_never_by_anything_else(): void
    {
        foreach (['Carla', 'Ana', 'Bruno'] as $name) {
            $psychologist = $this->psychologist();
            $psychologist->user->update(['name' => $name]);
        }

        $names = array_column(
            $this->as($this->patient()->user)->getJson(self::CATALOG)->assertOk()->json('data'),
            'name'
        );

        $this->assertSame(['Ana', 'Bruno', 'Carla'], $names);
    }

    public function test_catalog_filters_by_modality_exactly(): void
    {
        $online = $this->psychologist(['profile_modality' => 'online']);
        $this->psychologist(['profile_modality' => 'presencial']);
        $this->psychologist(['profile_modality' => 'ambos']);

        $response = $this->as($this->patient()->user)->getJson(self::CATALOG.'?modality=online')->assertOk();

        $this->assertSame([$online->id], array_column($response->json('data'), 'id'));
        $response->assertJsonPath('meta.total', 1);
    }

    public function test_catalog_rejects_invalid_modality_with_422(): void
    {
        $this->as($this->patient()->user)->getJson(self::CATALOG.'?modality=hibrido')
            ->assertStatus(422)
            ->assertJsonValidationErrors('modality');
    }

    public function test_catalog_filters_by_approach_specialty_and_region_with_contains(): void
    {
        $match = $this->psychologist([
            'profile_approach' => 'Terapia cognitivo-comportamental',
            'profile_specialty' => 'Ansiedade e estresse',
            'profile_region' => 'São Paulo, SP',
        ]);
        $this->psychologist([
            'profile_approach' => 'Psicanálise',
            'profile_specialty' => 'Luto',
            'profile_region' => 'Campinas, SP',
        ]);
        $patient = $this->patient();

        foreach (['approach=cognitivo', 'specialty=estresse', 'region=Paulo'] as $query) {
            $ids = array_column($this->as($patient->user)->getJson(self::CATALOG.'?'.$query)->assertOk()->json('data'), 'id');
            $this->assertSame([$match->id], $ids, $query);
        }
    }

    public function test_catalog_like_wildcards_in_filters_are_literal(): void
    {
        $this->psychologist(['profile_region' => 'São Paulo, SP']);
        $patient = $this->patient();

        foreach (['%', '_', '%Paulo', 'S_o Paulo'] as $term) {
            $this->as($patient->user)->getJson(self::CATALOG.'?region='.urlencode($term))
                ->assertOk()
                ->assertJsonPath('meta.total', 0);
        }
    }

    public function test_catalog_meta_is_exactly_total_page_per_page_and_paginates(): void
    {
        foreach (['Ana', 'Bruno', 'Carla'] as $name) {
            $this->psychologist()->user->update(['name' => $name]);
        }
        $patient = $this->patient();

        $first = $this->as($patient->user)->getJson(self::CATALOG)->assertOk();
        $this->assertSame(['total' => 3, 'page' => 1, 'per_page' => 20], $first->json('meta'));
        $this->assertSame(['data', 'meta'], array_keys($first->json()));

        $second = $this->as($patient->user)->getJson(self::CATALOG.'?per_page=2&page=2')->assertOk();
        $this->assertSame(['total' => 3, 'page' => 2, 'per_page' => 2], $second->json('meta'));
        $this->assertSame(['Carla'], array_column($second->json('data'), 'name'));
    }

    public function test_catalog_caps_per_page_at_fifty(): void
    {
        $this->as($this->patient()->user)->getJson(self::CATALOG.'?per_page=51')
            ->assertStatus(422)
            ->assertJsonValidationErrors('per_page');
    }

    public function test_psychologist_cannot_open_the_catalog(): void
    {
        $this->as($this->psychologist()->user)->getJson(self::CATALOG)->assertForbidden();
    }

    // ----------------------------------------- regra no banco e rotas (RNF-53)

    public function test_database_refuses_a_second_active_bond_for_the_same_patient(): void
    {
        $patient = $this->patient();
        Bond::factory()->active()->create(['patient_id' => $patient->id]);

        $this->expectException(QueryException::class);

        Bond::factory()->active()->create(['patient_id' => $patient->id]);
    }

    public function test_every_block_route_answers_401_without_token(): void
    {
        $routes = [
            ['POST', 'psychologist/invitations'],
            ['DELETE', 'psychologist/invitations/1'],
            ['POST', 'psychologist/bond-requests/1/accept'],
            ['POST', 'psychologist/bond-requests/1/reject'],
            ['POST', 'patient/bonds/redeem-invitation'],
            ['POST', 'patient/bonds/requests'],
            ['GET', 'catalog/psychologists'],
            ['POST', 'bonds/1/end'],
        ];

        foreach ($routes as [$method, $uri]) {
            $this->json($method, "/api/v1/{$uri}")
                ->assertUnauthorized()
                ->assertExactJson(['message' => 'Não autenticado. Entre para continuar.']);
        }
    }
}
