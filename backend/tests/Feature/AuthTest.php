<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Factories\UserFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

// Bloco A: conta e autenticacao (RF-01, RF-02, RF-05, RNF-07, RNF-09)
class AuthTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = UserFactory::PASSWORD;

    private const INVALID_CREDENTIALS = 'Credenciais inválidas.';

    // ---------------------------------------------------------------- registro

    public function test_adult_patient_registers_with_patient_row_and_hashed_password(): void
    {
        $response = $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'phone' => '11988887777',
        ]));

        $response->assertCreated()
            ->assertJsonPath('user.role', 'patient')
            ->assertJsonPath('user.email', 'paciente.adulto@example.com');
        $this->assertIsInt($response->json('user.id'));

        $user = User::where('email', 'paciente.adulto@example.com')->firstOrFail();
        $this->assertSame($user->id, $response->json('user.id'));
        $this->assertNotSame(self::PASSWORD, $user->getAuthPassword());
        $this->assertTrue(Hash::check(self::PASSWORD, $user->getAuthPassword()));

        $this->assertDatabaseHas('patients', [
            'user_id' => $user->id,
            'birth_date' => '1990-05-10',
            'phone' => '11988887777',
            'guardian_name' => null,
        ]);
    }

    public function test_register_response_has_only_the_contract_fields_and_no_secret(): void
    {
        $response = $this->postJson('/api/v1/auth/register', $this->patientPayload())->assertCreated();

        $this->assertSame(['user'], array_keys($response->json()));
        $this->assertSame(
            ['id', 'name', 'email', 'role', 'created_at'],
            array_keys($response->json('user'))
        );
        $content = $response->getContent();
        $this->assertStringNotContainsString('password', $content);
        $this->assertStringNotContainsString('token', $content);
        $this->assertStringNotContainsString(self::PASSWORD, $content);
    }

    public function test_patient_under_12_is_refused_and_nothing_is_saved(): void
    {
        $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'birth_date' => now()->subYears(11)->toDateString(),
        ]))
            ->assertStatus(422)
            ->assertJsonPath('errors.birth_date.0', 'A idade mínima de uso da plataforma é 12 anos.');

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('patients', 0);
    }

    public function test_age_limit_is_by_completed_years(): void
    {
        // faltando 1 dia para completar 12 anos: ainda tem 11
        $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'birth_date' => now()->subYears(12)->addDay()->toDateString(),
        ]))->assertStatus(422)->assertJsonValidationErrors('birth_date');
        $this->assertDatabaseCount('users', 0);

        // faz 12 anos hoje: entra, mas como menor precisa do responsavel
        $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'birth_date' => now()->subYears(12)->toDateString(),
        ] + $this->guardian()))->assertCreated();

        // faltando 1 dia para os 18: ainda e menor, responsavel obrigatorio
        $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'email' => 'quase.adulto@example.com',
            'birth_date' => now()->subYears(18)->addDay()->toDateString(),
        ]))->assertStatus(422)->assertJsonValidationErrors(['guardian_name']);

        // faz 18 anos hoje: adulto, responsavel opcional
        $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'email' => 'recem.adulto@example.com',
            'birth_date' => now()->subYears(18)->toDateString(),
        ]))->assertCreated();
    }

    public function test_patient_between_12_and_17_without_guardian_points_each_field(): void
    {
        $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'birth_date' => now()->subYears(15)->toDateString(),
        ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['guardian_name', 'guardian_phone', 'guardian_relationship']);

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('patients', 0);
    }

    public function test_patient_between_12_and_17_with_guardian_is_saved(): void
    {
        $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'birth_date' => now()->subYears(15)->toDateString(),
        ] + $this->guardian()))->assertCreated();

        $this->assertDatabaseHas('patients', [
            'guardian_name' => 'Maria Responsável',
            'guardian_phone' => '11977776666',
            'guardian_relationship' => 'mae',
        ]);
    }

    public function test_adult_with_partial_guardian_is_refused_before_the_database(): void
    {
        $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'guardian_name' => 'Maria Responsável',
        ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['guardian_phone', 'guardian_relationship'])
            ->assertJsonMissingValidationErrors('guardian_name');

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('patients', 0);
    }

    public function test_adult_with_full_guardian_is_accepted(): void
    {
        $this->postJson('/api/v1/auth/register', $this->patientPayload($this->guardian()))->assertCreated();

        $this->assertDatabaseHas('patients', ['guardian_name' => 'Maria Responsável']);
    }

    public function test_patient_needs_a_valid_past_birth_date(): void
    {
        $payload = $this->patientPayload();
        unset($payload['birth_date']);
        $this->postJson('/api/v1/auth/register', $payload)
            ->assertStatus(422)->assertJsonValidationErrors('birth_date');

        foreach (['10/05/1990', 'nao-e-data', now()->addDay()->toDateString(), now()->toDateString()] as $invalid) {
            $this->postJson('/api/v1/auth/register', $this->patientPayload(['birth_date' => $invalid]))
                ->assertStatus(422)->assertJsonValidationErrors('birth_date');
        }

        $this->assertDatabaseCount('users', 0);
    }

    public function test_duplicate_email_is_refused_without_leaking_the_existing_account(): void
    {
        User::factory()->create(['name' => 'Maria Já Cadastrada', 'email' => 'maria@example.com']);

        $response = $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'name' => 'Outra Pessoa',
            'email' => 'MARIA@Example.com',
        ]))
            ->assertStatus(422)
            ->assertExactJson([
                'message' => 'Os dados enviados são inválidos.',
                'errors' => ['email' => ['Este e-mail não pode ser usado.']],
            ]);

        $this->assertStringNotContainsString('Maria', $response->getContent());
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('patients', 0);
    }

    public function test_email_is_trimmed_and_lowercased_before_saving(): void
    {
        $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'email' => '  Fulano.Silva@Example.COM ',
        ]))->assertCreated()->assertJsonPath('user.email', 'fulano.silva@example.com');

        $this->assertDatabaseHas('users', ['email' => 'fulano.silva@example.com']);
    }

    public function test_admin_cannot_be_created_by_registration(): void
    {
        foreach (['admin', 'root', ''] as $role) {
            $this->postJson('/api/v1/auth/register', $this->patientPayload(['role' => $role]))
                ->assertStatus(422)->assertJsonValidationErrors('role');
        }

        $this->assertDatabaseCount('users', 0);
    }

    public function test_psychologist_registers_without_a_psychologist_row(): void
    {
        $payload = [
            'name' => 'Psicóloga de Teste',
            'email' => 'psicologa@example.com',
            'password' => self::PASSWORD,
            'role' => 'psychologist',
            'birth_date' => 'lixo-ignorado',
            'guardian_name' => 'Ignorado',
        ];

        $this->postJson('/api/v1/auth/register', $payload)
            ->assertCreated()
            ->assertJsonPath('user.role', 'psychologist');

        $this->assertDatabaseHas('users', ['email' => 'psicologa@example.com', 'role' => 'psychologist']);
        $this->assertDatabaseCount('psychologists', 0);
        $this->assertDatabaseCount('patients', 0);
    }

    public function test_register_validation_error_uses_the_contract_format(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);

        $this->assertSame('Os dados enviados são inválidos.', $response->json('message'));
        $this->assertSame(['message', 'errors'], array_keys($response->json()));
    }

    public function test_register_rejects_short_password_bad_email_and_long_fields(): void
    {
        $this->postJson('/api/v1/auth/register', $this->patientPayload([
            'password' => 'curta12',
            'email' => 'isto-nao-e-email',
            'name' => str_repeat('a', 151),
            'phone' => str_repeat('9', 21),
        ]))->assertStatus(422)->assertJsonValidationErrors(['password', 'email', 'name', 'phone']);

        $this->assertDatabaseCount('users', 0);
    }

    // ------------------------------------------------------------------- login

    public function test_login_returns_only_a_token_and_it_works_on_me(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/v1/auth/login', $this->credentials($user))->assertOk();

        $this->assertSame(['token'], array_keys($response->json()));
        $token = $response->json('token');
        $this->assertIsString($token);
        $this->assertNotSame('', $token);

        $this->getJson('/api/v1/me', $this->bearer($token))
            ->assertOk()
            ->assertJsonPath('id', $user->id);
    }

    public function test_each_login_creates_a_new_token_and_both_work(): void
    {
        $user = User::factory()->create();

        $first = $this->postJson('/api/v1/auth/login', $this->credentials($user))->json('token');
        $second = $this->postJson('/api/v1/auth/login', $this->credentials($user))->json('token');

        $this->assertNotSame($first, $second);
        $this->assertSame(2, $user->tokens()->count());
        $this->getJson('/api/v1/me', $this->bearer($first))->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/me', $this->bearer($second))->assertOk();
    }

    public function test_login_ignores_email_case(): void
    {
        User::factory()->create(['email' => 'caixa.mista@example.com']);

        $this->postJson('/api/v1/auth/login', [
            'email' => ' Caixa.Mista@EXAMPLE.com ',
            'password' => self::PASSWORD,
        ])->assertOk()->assertJsonStructure(['token']);
    }

    public function test_wrong_password_and_unknown_email_give_the_same_401(): void
    {
        $user = User::factory()->create();

        $wrongPassword = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'senha-errada-123',
        ]);
        $unknownEmail = $this->postJson('/api/v1/auth/login', [
            'email' => 'ninguem@example.com',
            'password' => self::PASSWORD,
        ]);

        $wrongPassword->assertStatus(401)->assertExactJson(['message' => self::INVALID_CREDENTIALS]);
        $unknownEmail->assertStatus(401)->assertExactJson(['message' => self::INVALID_CREDENTIALS]);
        $this->assertSame($wrongPassword->getContent(), $unknownEmail->getContent());
        $this->assertSame(0, DB::table('personal_access_tokens')->count());
    }

    public function test_suspended_user_cannot_login_and_gets_the_generic_401(): void
    {
        $user = User::factory()->create(['status' => 'suspended', 'suspended_at' => now()]);

        $suspended = $this->postJson('/api/v1/auth/login', $this->credentials($user));
        $wrongPassword = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'senha-errada-123',
        ]);

        $suspended->assertStatus(401)->assertExactJson(['message' => self::INVALID_CREDENTIALS]);
        $this->assertSame($wrongPassword->getContent(), $suspended->getContent());
        $this->assertSame(0, DB::table('personal_access_tokens')->count());
    }

    public function test_login_validates_presence_and_email_format(): void
    {
        $this->postJson('/api/v1/auth/login', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password'])
            ->assertJsonStructure(['message', 'errors']);

        $this->postJson('/api/v1/auth/login', ['email' => 'nao-e-email', 'password' => 'x'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    // ---------------------------------------------------------------------- me

    public function test_me_without_token_is_401(): void
    {
        $this->getJson('/api/v1/me')
            ->assertStatus(401)
            ->assertExactJson(['message' => 'Não autenticado. Entre para continuar.']);
    }

    public function test_me_with_invalid_token_is_401(): void
    {
        $this->getJson('/api/v1/me', $this->bearer('999|token-que-nao-existe'))
            ->assertStatus(401)
            ->assertExactJson(['message' => 'Não autenticado. Entre para continuar.']);
    }

    public function test_me_returns_the_flat_user_with_role_and_offset_date(): void
    {
        $user = User::factory()->psychologist()->create();
        $token = $this->loginToken($user);

        $response = $this->getJson('/api/v1/me', $this->bearer($token))->assertOk();

        $this->assertSame(['id', 'name', 'email', 'role', 'created_at'], array_keys($response->json()));
        $this->assertSame($user->id, $response->json('id'));
        $this->assertSame($user->name, $response->json('name'));
        $this->assertSame($user->email, $response->json('email'));
        $this->assertSame('psychologist', $response->json('role'));
        $this->assertMatchesRegularExpression(
            '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/',
            $response->json('created_at')
        );
        $this->assertStringNotContainsString('Z"', $response->getContent());
        $this->assertStringNotContainsString('password', $response->getContent());
    }

    // ------------------------------------------------------------------ logout

    public function test_logout_without_token_is_401(): void
    {
        $this->postJson('/api/v1/auth/logout')->assertStatus(401);
    }

    public function test_logout_revokes_every_token_of_the_user(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $first = $this->loginToken($user);
        $second = $this->loginToken($user);
        $otherToken = $this->loginToken($other);

        $this->getJson('/api/v1/me', $this->bearer($first))->assertOk();
        $this->app['auth']->forgetGuards();

        $this->postJson('/api/v1/auth/logout', [], $this->bearer($first))
            ->assertOk()
            ->assertExactJson(['message' => 'Sessão encerrada.']);
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/v1/me', $this->bearer($first))->assertStatus(401);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/me', $this->bearer($second))->assertStatus(401);
        $this->app['auth']->forgetGuards();

        $this->assertSame(0, $user->tokens()->count());
        $this->getJson('/api/v1/me', $this->bearer($otherToken))->assertOk();
    }

    // ----------------------------------------------- expiracao por inatividade

    public function test_token_idle_for_29_minutes_still_works_and_renews_the_window(): void
    {
        $token = $this->loginToken(User::factory()->create());

        $this->travel(29)->minutes();
        $this->getJson('/api/v1/me', $this->bearer($token))->assertOk();
        $this->app['auth']->forgetGuards();

        // 58 minutos desde o login, mas so 29 desde o ultimo uso
        $this->travel(29)->minutes();
        $this->getJson('/api/v1/me', $this->bearer($token))->assertOk();
    }

    public function test_token_idle_for_31_minutes_is_401(): void
    {
        $token = $this->loginToken(User::factory()->create());

        $this->travel(31)->minutes();

        $this->getJson('/api/v1/me', $this->bearer($token))
            ->assertStatus(401)
            ->assertExactJson(['message' => 'Não autenticado. Entre para continuar.']);
    }

    public function test_token_used_at_29_minutes_expires_31_minutes_after_that_use(): void
    {
        $token = $this->loginToken(User::factory()->create());

        $this->travel(29)->minutes();
        $this->getJson('/api/v1/me', $this->bearer($token))->assertOk();
        $this->app['auth']->forgetGuards();

        $this->travel(31)->minutes();
        $this->getJson('/api/v1/me', $this->bearer($token))->assertStatus(401);
    }

    // ----------------------------------------------------------------- helpers

    private function patientPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Paciente Adulto',
            'email' => 'paciente.adulto@example.com',
            'password' => self::PASSWORD,
            'role' => 'patient',
            'birth_date' => '1990-05-10',
        ], $overrides);
    }

    private function guardian(): array
    {
        return [
            'guardian_name' => 'Maria Responsável',
            'guardian_phone' => '11977776666',
            'guardian_relationship' => 'mae',
        ];
    }

    private function credentials(User $user): array
    {
        return ['email' => $user->email, 'password' => self::PASSWORD];
    }

    private function bearer(string $token): array
    {
        return ['Authorization' => 'Bearer '.$token];
    }

    // Login real pela API; o guard guarda o usuario entre requisicoes do mesmo teste, entao limpa
    private function loginToken(User $user): string
    {
        $token = $this->postJson('/api/v1/auth/login', $this->credentials($user))->json('token');
        $this->app['auth']->forgetGuards();

        return $token;
    }
}
