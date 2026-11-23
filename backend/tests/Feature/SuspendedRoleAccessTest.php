<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuspendedRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_suspended_admin_with_old_token_cannot_open_api_queue(): void
    {
        $admin = User::factory()->admin()->create();
        $token = $admin->createToken('mobile')->plainTextToken;
        $admin->update(['status' => 'suspended', 'suspended_at' => now()]);

        $this->getJson('/api/v1/admin/registrations', ['Authorization' => 'Bearer '.$token])
            ->assertForbidden();
    }

    public function test_suspended_admin_with_existing_web_session_cannot_open_panel(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);
        $admin->update(['status' => 'suspended', 'suspended_at' => now()]);

        $this->get('/admin/registrations')->assertForbidden();
    }

    private function suspendedWithToken(User $user): array
    {
        $token = $user->createToken('mobile')->plainTextToken;
        $user->update(['status' => 'suspended', 'suspended_at' => now()]);

        return ['Authorization' => 'Bearer '.$token];
    }

    public function test_suspended_patient_with_old_token_cannot_use_chat(): void
    {
        $bond = Bond::factory()->active()->create();
        $term = ConsentTerm::factory()->create();
        ConsentAcceptance::factory()->create(['user_id' => $bond->patient->user_id, 'consent_term_id' => $term->id]);
        $headers = $this->suspendedWithToken($bond->patient->user);
        $url = "/api/v1/bonds/{$bond->id}/messages";

        $this->getJson($url, $headers)->assertForbidden()
            ->assertExactJson(['message' => 'Você não tem permissão para realizar esta ação.']);
        $this->postJson($url, ['body' => 'Oi'], $headers)->assertForbidden();
        $this->postJson($url.'/read', [], $headers)->assertForbidden();
    }

    public function test_suspended_user_with_old_token_cannot_use_consent(): void
    {
        $term = ConsentTerm::factory()->create(['effective_from' => now()->subDay()]);
        $user = User::factory()->create();
        $acceptance = ConsentAcceptance::factory()->create(['user_id' => $user->id, 'consent_term_id' => $term->id]);
        $headers = $this->suspendedWithToken($user);

        $this->getJson('/api/v1/consent-terms/current', $headers)->assertForbidden()
            ->assertExactJson(['message' => 'Você não tem permissão para realizar esta ação.']);
        $this->postJson('/api/v1/consent-acceptances', ['consent_term_id' => $term->id], $headers)->assertForbidden();
        $this->postJson("/api/v1/consent-acceptances/{$acceptance->id}/revoke", [], $headers)->assertForbidden();
    }

    public function test_suspended_user_with_old_token_cannot_read_me_but_can_log_out(): void
    {
        $user = User::factory()->create();
        $headers = $this->suspendedWithToken($user);

        $this->getJson('/api/v1/me', $headers)->assertForbidden()
            ->assertExactJson(['message' => 'Você não tem permissão para realizar esta ação.']);
        $this->postJson('/api/v1/auth/logout', [], $headers)->assertOk();
        $this->assertSame(0, $user->tokens()->count());
    }
}
