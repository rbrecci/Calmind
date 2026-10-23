<?php

namespace Tests\Feature;

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
}
