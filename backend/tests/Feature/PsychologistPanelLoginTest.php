<?php

namespace Tests\Feature;

use App\Models\Psychologist;
use Database\Factories\UserFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PsychologistPanelLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_root_redirects_to_psychologist_login(): void
    {
        $this->get('/')->assertRedirect(route('psychologist.login'));
    }

    public function test_pending_psychologist_returns_to_form_with_message_and_no_session(): void
    {
        $psychologist = Psychologist::factory()->create();

        $this->from('/psychologist/login')
            ->post('/psychologist/login', ['email' => $psychologist->user->email, 'password' => UserFactory::PASSWORD])
            ->assertRedirect('/psychologist/login')
            ->assertSessionHasErrors(['email' => 'Seu cadastro profissional ainda está em análise. O acesso ao painel é liberado após a aprovação.']);

        $this->assertGuest();
    }

    public function test_rejected_psychologist_returns_to_form_with_message_and_no_session(): void
    {
        $psychologist = Psychologist::factory()->create(['approval_status' => 'rejected']);

        $this->from('/psychologist/login')
            ->post('/psychologist/login', ['email' => $psychologist->user->email, 'password' => UserFactory::PASSWORD])
            ->assertRedirect('/psychologist/login')
            ->assertSessionHasErrors(['email' => 'Seu cadastro profissional não foi aprovado. Veja o motivo e envie um novo cadastro pelo aplicativo.']);

        $this->assertGuest();
    }

    public function test_message_appears_on_login_form(): void
    {
        $psychologist = Psychologist::factory()->create();

        $this->followingRedirects()
            ->from('/psychologist/login')
            ->post('/psychologist/login', ['email' => $psychologist->user->email, 'password' => UserFactory::PASSWORD])
            ->assertOk()
            ->assertSee('Seu cadastro profissional ainda está em análise.');
    }

    public function test_approved_psychologist_still_logs_in(): void
    {
        $psychologist = Psychologist::factory()->approved()->create();

        $this->post('/psychologist/login', ['email' => $psychologist->user->email, 'password' => UserFactory::PASSWORD])
            ->assertRedirect('/psychologist/tasks');

        $this->assertAuthenticatedAs($psychologist->user);
    }

    public function test_wrong_password_keeps_generic_message(): void
    {
        $psychologist = Psychologist::factory()->create();

        $this->from('/psychologist/login')
            ->post('/psychologist/login', ['email' => $psychologist->user->email, 'password' => 'senha-errada'])
            ->assertSessionHasErrors(['email' => 'E-mail ou senha inválidos.']);

        $this->assertGuest();
    }
}
