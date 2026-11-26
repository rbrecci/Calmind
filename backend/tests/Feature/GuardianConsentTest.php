<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\ConsentTerm;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class GuardianConsentTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    private function payload(): array
    {
        return ['guardian_name' => 'Responsável fictício', 'obtained_at' => today()->toDateString(), 'method' => 'presencial', 'note' => 'Registro fictício de demonstração.'];
    }

    public function test_minor_consent_is_append_only_and_server_sets_term_and_author(): void
    {
        $term = ConsentTerm::factory()->create();
        $bond = Bond::factory()->active()->create(['patient_id' => Patient::factory()->minor()]);
        $url = '/api/v1/psychologist/patients/'.$bond->patient->user_id.'/guardian-consent';
        $this->as($bond->psychologist->user)->getJson($url)->assertOk()->assertJsonPath('meta.total', 0);
        $payload = array_merge($this->payload(), ['consent_term_id' => 9999, 'registered_by_user_id' => 9999]);
        $first = $this->postJson($url, $payload)->assertCreated()->assertJsonPath('consent_term_id', $term->id)->assertJsonPath('registered_by_user_id', $bond->psychologist->user_id)->assertJsonPath('obtained_at', today()->toDateString());
        $second = $this->postJson($url, array_merge($this->payload(), ['method' => 'telefone']))->assertCreated();
        $this->assertNotSame($first->json('id'), $second->json('id'));
        $this->assertDatabaseHas('guardian_consents', ['id' => $first->json('id'), 'method' => 'presencial']);
        $this->getJson($url.'?per_page=1')->assertOk()->assertJsonPath('meta.total', 2)->assertJsonPath('meta.per_page', 1)->assertJsonCount(1, 'data');
        $this->putJson($url, $this->payload())->assertStatus(405);
        $this->deleteJson($url)->assertStatus(405);
    }

    public function test_consent_shows_who_registered_it_without_extra_queries_per_record(): void
    {
        ConsentTerm::factory()->create();
        $bond = Bond::factory()->active()->create(['patient_id' => Patient::factory()->minor()]);
        $psychologist = $bond->psychologist;
        $author = ['id' => $psychologist->user_id, 'name' => $psychologist->user->name, 'crp' => $psychologist->crp_region.'/'.$psychologist->crp_number];
        $url = '/api/v1/psychologist/patients/'.$bond->patient->user_id.'/guardian-consent';

        // CA-49.3: quem registrou e quando
        $this->as($psychologist->user)->postJson($url, $this->payload())->assertCreated()
            ->assertJsonPath('registered_by', $author)->assertJsonPath('registered_by_user_id', $psychologist->user_id);
        $this->getJson($url)->assertOk()->assertJsonPath('data.0.registered_by', $author)->assertJsonPath('data.0.created_at', fn ($value) => is_string($value));

        $queries = function () use ($url): int {
            DB::flushQueryLog();
            DB::enableQueryLog();
            $this->getJson($url)->assertOk();

            return count(DB::getQueryLog());
        };
        $few = $queries();
        foreach (range(1, 3) as $ignored) {
            $this->postJson($url, $this->payload())->assertCreated();
        }
        $this->assertSame($few, $queries());
    }

    public function test_consent_requires_own_active_bond_approval_and_minor_patient(): void
    {
        ConsentTerm::factory()->create();
        $bond = Bond::factory()->active()->create(['patient_id' => Patient::factory()->minor()]);
        $url = '/api/v1/psychologist/patients/'.$bond->patient->user_id.'/guardian-consent';
        $this->getJson($url)->assertUnauthorized();
        $this->as($bond->patient->user)->postJson($url, $this->payload())->assertForbidden();
        $this->as(Psychologist::factory()->approved()->create()->user)->getJson($url)->assertNotFound();
        $this->postJson($url, $this->payload())->assertNotFound();
        $bond->update(['status' => 'ended', 'ended_at' => now()]);
        $this->as($bond->psychologist->user)->getJson($url)->assertNotFound();
        $this->postJson($url, $this->payload())->assertNotFound();
        $bond->update(['status' => 'active', 'ended_at' => null]);
        $bond->patient->update(['birth_date' => today()->subYears(18)]);
        $this->getJson($url)->assertUnprocessable()->assertJsonValidationErrors('patient');
        $this->postJson($url, $this->payload())->assertUnprocessable()->assertJsonValidationErrors('patient');
        $bond->psychologist->update(['approval_status' => 'rejected']);
        $this->as($bond->psychologist->user)->getJson($url)->assertForbidden();
    }

    public function test_invalid_fields_and_missing_current_term_do_not_create_records(): void
    {
        $bond = Bond::factory()->active()->create(['patient_id' => Patient::factory()->minor()]);
        $url = '/api/v1/psychologist/patients/'.$bond->patient->user_id.'/guardian-consent';
        $this->as($bond->psychologist->user)->postJson($url, ['guardian_name' => str_repeat('a', 151), 'obtained_at' => today()->addDay()->toDateString(), 'method' => 'invalido'])->assertUnprocessable()->assertJsonValidationErrors(['guardian_name', 'obtained_at', 'method']);
        $this->postJson($url, $this->payload())->assertNotFound();
        $this->assertDatabaseCount('guardian_consents', 0);
    }
}
