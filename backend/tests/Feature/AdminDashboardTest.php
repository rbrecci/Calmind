<?php

namespace Tests\Feature;

use App\Models\Psychologist;
use App\Models\User;
use Database\Factories\UserFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_logs_in_with_web_session(): void
    {
        $admin = User::factory()->admin()->create();

        $this->post('/admin/login', [
            'email' => $admin->email,
            'password' => UserFactory::PASSWORD,
        ])->assertRedirect('/admin/registrations');

        $this->assertAuthenticatedAs($admin);
    }

    public function test_patient_cannot_log_in_to_admin_panel(): void
    {
        $patient = User::factory()->create();

        $this->post('/admin/login', [
            'email' => $patient->email,
            'password' => UserFactory::PASSWORD,
        ])->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_admin_queue_shows_registration_and_document(): void
    {
        $psychologist = Psychologist::factory()->create();
        $document = $psychologist->documents()->create([
            'file_path' => 'psychologist-documents/exemplo.pdf',
            'original_name' => 'exemplo.pdf',
            'mime_type' => 'application/pdf',
        ]);

        $this->actingAs(User::factory()->admin()->create())
            ->get('/admin/registrations')
            ->assertOk()
            ->assertSee($psychologist->user->name)
            ->assertSee('06/'.$psychologist->crp_number)
            ->assertSee('/admin/documents/'.$document->id);
    }

    public function test_patient_cannot_open_admin_queue_or_approve(): void
    {
        $psychologist = Psychologist::factory()->create();

        $this->actingAs(User::factory()->create())
            ->get('/admin/registrations')->assertForbidden();
        $this->post("/admin/registrations/{$psychologist->id}/approve")->assertForbidden();
        $this->assertSame('pending', $psychologist->fresh()->approval_status);
    }

    public function test_admin_approves_from_panel(): void
    {
        $psychologist = Psychologist::factory()->create();
        $psychologist->documents()->create([
            'file_path' => 'psychologist-documents/exemplo.pdf',
            'original_name' => 'exemplo.pdf',
            'mime_type' => 'application/pdf',
        ]);

        $this->actingAs(User::factory()->admin()->create())
            ->post("/admin/registrations/{$psychologist->id}/approve")
            ->assertRedirect('/admin/registrations')
            ->assertSessionHas('status');

        $this->assertSame('approved', $psychologist->fresh()->approval_status);
    }

    public function test_admin_approval_without_document_shows_message_in_panel(): void
    {
        $psychologist = Psychologist::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->post("/admin/registrations/{$psychologist->id}/approve")
            ->assertRedirect('/admin/registrations')
            ->assertSessionHasErrors(['registration' => 'O cadastro precisa de documento comprobatório.']);

        $this->assertSame('pending', $psychologist->fresh()->approval_status);
    }

    public function test_admin_deciding_twice_shows_message_in_panel(): void
    {
        $psychologist = Psychologist::factory()->create(['approval_status' => 'approved']);

        $this->actingAs(User::factory()->admin()->create())
            ->post("/admin/registrations/{$psychologist->id}/approve")
            ->assertRedirect('/admin/registrations')
            ->assertSessionHasErrors(['registration' => 'Este cadastro não está pendente.']);
    }

    public function test_admin_rejection_from_panel_requires_reason(): void
    {
        $psychologist = Psychologist::factory()->create();
        $this->actingAs(User::factory()->admin()->create());

        $this->post("/admin/registrations/{$psychologist->id}/reject")
            ->assertSessionHasErrors('reason');
        $this->assertSame('pending', $psychologist->fresh()->approval_status);

        $this->post("/admin/registrations/{$psychologist->id}/reject", ['reason' => 'Documento ilegível.'])
            ->assertRedirect('/admin/registrations');
        $this->assertSame('rejected', $psychologist->fresh()->approval_status);
    }
}
