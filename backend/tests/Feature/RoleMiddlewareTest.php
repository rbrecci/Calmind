<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

// RF-05, CA-05.3: cada rota aceita apenas o papel autorizado
class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['api', 'auth:sanctum', 'role:patient'])
            ->get('api/v1/_probe/patient', fn () => response()->json(['ok' => true]));
        Route::middleware(['api', 'auth:sanctum', 'role:psychologist,admin'])
            ->get('api/v1/_probe/staff', fn () => response()->json(['ok' => true]));
    }

    private function bearer(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('mobile')->plainTextToken];
    }

    public function test_allowed_role_passes(): void
    {
        $patient = User::factory()->create();

        $this->getJson('api/v1/_probe/patient', $this->bearer($patient))
            ->assertOk()
            ->assertJson(['ok' => true]);
    }

    public function test_several_roles_can_be_listed(): void
    {
        $admin = User::factory()->admin()->create();

        $this->getJson('api/v1/_probe/staff', $this->bearer($admin))->assertOk();
    }

    public function test_other_role_gets_403_in_contract_format(): void
    {
        $psychologist = User::factory()->psychologist()->create();

        $this->getJson('api/v1/_probe/patient', $this->bearer($psychologist))
            ->assertForbidden()
            ->assertExactJson(['message' => 'Você não tem permissão para realizar esta ação.']);
    }

    public function test_patient_cannot_reach_staff_route(): void
    {
        $patient = User::factory()->create();

        $this->getJson('api/v1/_probe/staff', $this->bearer($patient))->assertForbidden();
    }

    public function test_without_token_it_is_401_not_403(): void
    {
        $this->getJson('api/v1/_probe/patient')->assertUnauthorized();
    }
}
