<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\ConsentTerm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsentApiTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    public function test_current_term_accept_revoke_and_reaccept_are_idempotent(): void
    {
        $term = ConsentTerm::factory()->create(['effective_from' => now()->subDay()]);
        $user = User::factory()->create();
        $this->as($user)->getJson('/api/v1/consent-terms/current')->assertOk()->assertJsonPath('accepted', false)->assertJsonPath('id', $term->id);
        $first = $this->postJson('/api/v1/consent-acceptances', ['consent_term_id' => $term->id])->assertCreated();
        $id = $first->json('id');
        $this->travel(1)->minutes();
        $this->postJson('/api/v1/consent-acceptances', ['consent_term_id' => $term->id])->assertOk()->assertJsonPath('accepted_at', $first->json('accepted_at'));
        $this->getJson('/api/v1/consent-terms/current')->assertJsonPath('accepted', true);
        $revoked = $this->postJson("/api/v1/consent-acceptances/{$id}/revoke")->assertOk();
        $this->travel(1)->minutes();
        $this->postJson("/api/v1/consent-acceptances/{$id}/revoke")->assertOk()->assertJsonPath('revoked_at', $revoked->json('revoked_at'));
        $this->getJson('/api/v1/consent-terms/current')->assertJsonPath('accepted', false);
        $again = $this->postJson('/api/v1/consent-acceptances', ['consent_term_id' => $term->id])->assertOk()->assertJsonPath('id', $id)->assertJsonPath('revoked_at', null);
        $this->assertNotSame($first->json('accepted_at'), $again->json('accepted_at'));
        $this->as(User::factory()->create())->postJson("/api/v1/consent-acceptances/{$id}/revoke")->assertNotFound();
    }

    public function test_current_selection_and_invalid_terms_and_roles(): void
    {
        $old = ConsentTerm::factory()->create(['version' => '0.9', 'effective_from' => now()->subDays(2)]);
        $current = ConsentTerm::factory()->create(['effective_from' => now()->subDay()]);
        $current = ConsentTerm::factory()->create(['version' => '1.1', 'effective_from' => $current->effective_from]);
        ConsentTerm::factory()->create(['version' => '2.0', 'effective_from' => now()->addDay()]);
        $this->as(User::factory()->create())->getJson('/api/v1/consent-terms/current')->assertOk()->assertJsonPath('id', $current->id);
        $this->getJson('/api/v1/consent-terms/current?type=invalid')->assertUnprocessable()->assertJsonValidationErrors('type');
        $this->postJson('/api/v1/consent-acceptances', ['consent_term_id' => $old->id])->assertUnprocessable()->assertJsonValidationErrors('consent_term_id');
        $this->getJson('/api/v1/consent-terms/current?type=ai_analysis')->assertNotFound();
        $ai = ConsentTerm::factory()->create(['type' => 'ai_analysis']);
        $this->as(User::factory()->psychologist()->create())->postJson('/api/v1/consent-acceptances', ['consent_term_id' => $ai->id])->assertForbidden();
    }

    public function test_revoking_general_consent_blocks_new_report(): void
    {
        $term = ConsentTerm::factory()->create();
        $bond = Bond::factory()->active()->create();
        $patient = $bond->patient;
        $accepted = $this->as($patient->user)->postJson('/api/v1/consent-acceptances', ['consent_term_id' => $term->id])->assertCreated();
        $this->postJson('/api/v1/consent-acceptances/'.$accepted->json('id').'/revoke')->assertOk();
        $this->postJson('/api/v1/patient/reports', ['body' => 'Registro fictício', 'visibility' => 'private'])->assertForbidden();
        $this->as($bond->psychologist->user)->postJson('/api/v1/psychologist/tasks', [
            'bond_id' => $bond->id, 'title' => 'Tarefa fictícia', 'due_date' => now()->addDay()->toDateString(),
        ])->assertForbidden();
    }
}
