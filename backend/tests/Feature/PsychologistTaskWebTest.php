<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Task;
use App\Models\User;
use Database\Factories\UserFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PsychologistTaskWebTest extends TestCase
{
    use RefreshDatabase;

    public function test_psychologist_logs_in_and_creates_task_from_web_form(): void
    {
        $bond = Bond::factory()->active()->create();
        $term = ConsentTerm::create([
            'type' => 'general',
            'version' => '1.0',
            'body' => 'Termo de teste',
            'effective_from' => now()->subDay(),
            'published_by_user_id' => User::factory()->admin()->create()->id,
        ]);
        ConsentAcceptance::create(['user_id' => $bond->patient->user_id, 'consent_term_id' => $term->id]);

        $this->post('/psychologist/login', [
            'email' => $bond->psychologist->user->email,
            'password' => UserFactory::PASSWORD,
        ])->assertRedirect('/psychologist/tasks');
        $this->assertAuthenticatedAs($bond->psychologist->user);

        $this->get('/psychologist/tasks')->assertOk()
            ->assertSee($bond->patient->user->name);

        $this->post('/psychologist/tasks', [
            'bond_id' => $bond->id,
            'title' => 'Respirar',
            'description' => 'Cinco minutos',
            'due_date' => now()->addDay()->toDateString(),
        ])->assertRedirect('/psychologist/tasks');

        $this->assertDatabaseHas('tasks', ['bond_id' => $bond->id, 'title' => 'Respirar']);
        $this->get('/psychologist/tasks')->assertSee('Respirar')->assertSee('Pendente');
        Task::query()->firstOrFail()->update(['completed_at' => now()]);
        $this->get('/psychologist/tasks')->assertSee('Concluída em');
    }

    public function test_patient_and_bad_password_cannot_enter_psychologist_web(): void
    {
        $patient = User::factory()->create();

        $this->post('/psychologist/login', [
            'email' => $patient->email,
            'password' => UserFactory::PASSWORD,
        ])->assertSessionHasErrors('email');
        $this->assertGuest();

        $bond = Bond::factory()->active()->create();
        $this->post('/psychologist/login', [
            'email' => $bond->psychologist->user->email,
            'password' => 'senha-errada',
        ])->assertSessionHasErrors('email');
        $this->assertGuest();

        $this->actingAs($patient)->get('/psychologist/tasks')->assertForbidden();
        $this->actingAs($patient)->post('/psychologist/tasks', [])->assertForbidden();
    }

    public function test_web_task_creation_refuses_other_psychologist_bond(): void
    {
        $own = Bond::factory()->active()->create();
        $other = Bond::factory()->active()->create();

        $this->actingAs($own->psychologist->user)->post('/psychologist/tasks', [
            'bond_id' => $other->id,
            'title' => 'Invasao',
            'due_date' => now()->addDay()->toDateString(),
        ])->assertNotFound();
        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_unapproved_psychologist_cannot_open_task_page(): void
    {
        $bond = Bond::factory()->active()->create();
        $bond->psychologist->update(['approval_status' => 'rejected']);

        $this->actingAs($bond->psychologist->user)->get('/psychologist/tasks')->assertForbidden();
    }
}
