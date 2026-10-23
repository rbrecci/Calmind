<?php

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class PsychologistRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    private function register(User $user, array $fields = []): TestResponse
    {
        return $this->as($user)->post('/api/v1/psychologist/registration', array_replace([
            'crp_region' => '06',
            'crp_number' => '123456',
            'document' => UploadedFile::fake()->create('comprovante.pdf', 100, 'application/pdf'),
        ], $fields), ['Accept' => 'application/json']);
    }

    public function test_registration_requires_valid_crp_and_document(): void
    {
        Storage::fake('local');
        $user = User::factory()->psychologist()->create();

        $this->register($user, ['crp_region' => '99', 'crp_number' => 'abc', 'document' => null])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['crp_region', 'crp_number', 'document']);
        $this->assertDatabaseCount('psychologists', 0);
    }

    public function test_registration_stores_private_document_and_starts_pending(): void
    {
        Storage::fake('local');
        $user = User::factory()->psychologist()->create();

        $this->register($user)->assertCreated()->assertJsonPath('approval_status', 'pending');

        $psychologist = Psychologist::firstOrFail();
        $this->assertSame($user->id, $psychologist->user_id);
        $this->assertDatabaseCount('psychologist_documents', 1);
        Storage::disk('local')->assertExists($psychologist->documents()->firstOrFail()->file_path);
    }

    public function test_crp_cannot_be_claimed_twice(): void
    {
        Storage::fake('local');
        $this->register(User::factory()->psychologist()->create())->assertCreated();

        $this->register(User::factory()->psychologist()->create())
            ->assertStatus(422)
            ->assertJsonValidationErrors('crp_number');
        $this->assertDatabaseCount('psychologists', 1);
    }

    public function test_non_admin_cannot_approve(): void
    {
        $psychologist = Psychologist::factory()->create();

        $this->as(Patient::factory()->create()->user)
            ->postJson("/api/v1/admin/registrations/{$psychologist->id}/approve")
            ->assertForbidden();
        $this->assertSame('pending', $psychologist->fresh()->approval_status);
    }

    public function test_admin_approval_allows_publication_and_catalog_listing(): void
    {
        $psychologist = Psychologist::factory()->create();
        $psychologist->documents()->create([
            'file_path' => 'psychologist-documents/exemplo.pdf',
            'original_name' => 'exemplo.pdf',
            'mime_type' => 'application/pdf',
        ]);
        $admin = User::factory()->admin()->create();

        $this->as($admin)->postJson("/api/v1/admin/registrations/{$psychologist->id}/approve")
            ->assertOk()
            ->assertJsonPath('approval_status', 'approved');

        $this->as(Patient::factory()->create()->user)->getJson('/api/v1/catalog/psychologists')
            ->assertJsonPath('meta.total', 0);

        $this->as($psychologist->user)->putJson('/api/v1/psychologist/profile', [
            'profile_approach' => 'TCC',
            'profile_bio' => 'Atendimento para ansiedade.',
        ])->assertOk();
        $this->as($psychologist->user)->postJson('/api/v1/psychologist/profile/publish')->assertOk();

        $this->as(Patient::factory()->create()->user)->getJson('/api/v1/catalog/psychologists')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.id', $psychologist->id);
    }

    public function test_admin_cannot_approve_registration_without_document(): void
    {
        $psychologist = Psychologist::factory()->create();

        $this->as(User::factory()->admin()->create())
            ->postJson("/api/v1/admin/registrations/{$psychologist->id}/approve")
            ->assertStatus(409);
        $this->assertSame('pending', $psychologist->fresh()->approval_status);
    }

    public function test_pending_professional_cannot_publish(): void
    {
        $psychologist = Psychologist::factory()->create(['profile_bio' => 'Texto manual.']);

        $this->as($psychologist->user)->postJson('/api/v1/psychologist/profile/publish')->assertForbidden();
        $this->assertNull($psychologist->fresh()->profile_published_at);
    }

    public function test_profile_cannot_publish_honorarium_written_in_reais(): void
    {
        $psychologist = Psychologist::factory()->approved()->create([
            'profile_bio' => 'Atendimento por 50 reais por sessão.',
        ]);

        $this->as($psychologist->user)
            ->postJson('/api/v1/psychologist/profile/publish')
            ->assertStatus(422)
            ->assertJsonValidationErrors('profile_bio');
        $this->assertNull($psychologist->fresh()->profile_published_at);
    }

    public function test_rejection_requires_reason_and_allows_resubmission(): void
    {
        Storage::fake('local');
        $psychologist = Psychologist::factory()->create();
        $admin = User::factory()->admin()->create();

        $this->as($admin)->postJson("/api/v1/admin/registrations/{$psychologist->id}/reject", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('reason');
        $this->as($admin)->postJson("/api/v1/admin/registrations/{$psychologist->id}/reject", ['reason' => 'Documento ilegivel.'])
            ->assertOk()
            ->assertJsonPath('approval_status', 'rejected');

        $this->register($psychologist->user, ['crp_number' => '654321'])
            ->assertOk()
            ->assertJsonPath('approval_status', 'pending');
    }

    public function test_only_owner_and_admin_can_download_document(): void
    {
        Storage::fake('local');
        $owner = User::factory()->psychologist()->create();
        $this->register($owner)->assertCreated();
        $document = $owner->psychologist->documents()->firstOrFail();

        $this->as($owner)->get("/api/v1/psychologist/documents/{$document->id}")->assertOk();
        $this->as(User::factory()->admin()->create())->get("/api/v1/admin/documents/{$document->id}")->assertOk();
        $this->as(User::factory()->psychologist()->create())
            ->get("/api/v1/psychologist/documents/{$document->id}")->assertNotFound();
    }
}
