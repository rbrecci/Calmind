<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Bond;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class ProfileImageTest extends TestCase
{
    use RefreshDatabase;

    // PNG 1x1 valido: o PHP desta maquina nao tem GD, entao UploadedFile::fake()->image() nao serve
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    private function png(string $name = 'foto.png'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, base64_decode(self::PNG));
    }

    private function upload(User $user, string $kind, ?UploadedFile $file = null): TestResponse
    {
        return $this->as($user)->post("/api/v1/me/{$kind}", ['image' => $file ?? $this->png()], ['Accept' => 'application/json']);
    }

    private function withImage(User $user, string $kind = 'avatar'): User
    {
        $this->upload($user, $kind)->assertOk();

        return $user->fresh();
    }

    private function expectedUrl(User $user, string $kind): string
    {
        $path = $user->fresh()->{$kind.'_path'};

        return rtrim(config('app.url'), '/')."/api/v1/users/{$user->id}/{$kind}?v=".substr(sha1($path), 0, 12);
    }

    public function test_envio_valido_guarda_no_disco_privado_e_devolve_o_usuario_com_url(): void
    {
        $user = Patient::factory()->create()->user;

        $response = $this->upload($user, 'avatar')->assertOk()->assertJsonPath('id', $user->id);

        $path = $user->fresh()->avatar_path;
        $this->assertStringStartsWith('avatars/', $path);
        Storage::disk('local')->assertExists($path);
        $response->assertJsonPath('avatar_url', $this->expectedUrl($user, 'avatar'))->assertJsonPath('cover_url', null);

        $this->upload($user, 'cover')->assertOk();
        $this->assertStringStartsWith('covers/', $user->fresh()->cover_path);
        $this->as($user)->getJson('/api/v1/me')->assertOk()
            ->assertJsonPath('avatar_url', $this->expectedUrl($user, 'avatar'))
            ->assertJsonPath('cover_url', $this->expectedUrl($user, 'cover'));
    }

    public function test_envio_recusa_arquivo_que_nao_e_imagem(): void
    {
        $user = Patient::factory()->create()->user;

        $this->upload($user, 'avatar', UploadedFile::fake()->create('laudo.pdf', 10, 'application/pdf'))
            ->assertStatus(422)->assertJsonValidationErrors('image');
        $this->upload($user, 'cover', UploadedFile::fake()->create('desenho.gif', 10, 'image/gif'))
            ->assertStatus(422)->assertJsonValidationErrors('image');
        $this->as($user)->postJson('/api/v1/me/avatar', [])->assertStatus(422)->assertJsonValidationErrors('image');

        $this->assertNull($user->fresh()->avatar_path);
        $this->assertNull($user->fresh()->cover_path);
    }

    public function test_envio_recusa_imagem_maior_que_2_mb(): void
    {
        $user = Patient::factory()->create()->user;

        $this->upload($user, 'avatar', UploadedFile::fake()->create('grande.png', 2049, 'image/png'))
            ->assertStatus(422)->assertJsonValidationErrors('image');
        $this->assertNull($user->fresh()->avatar_path);
    }

    public function test_troca_apaga_o_arquivo_antigo_e_muda_a_url(): void
    {
        $user = Psychologist::factory()->approved()->create()->user;

        $first = $this->upload($user, 'cover')->assertOk()->json('cover_url');
        $old = $user->fresh()->cover_path;

        $second = $this->upload($user, 'cover', $this->png('outra.png'))->assertOk()->json('cover_url');
        $new = $user->fresh()->cover_path;

        $this->assertNotSame($old, $new);
        $this->assertNotSame($first, $second);
        Storage::disk('local')->assertMissing($old);
        Storage::disk('local')->assertExists($new);
    }

    public function test_remocao_apaga_o_arquivo_e_zera_a_url(): void
    {
        $user = $this->withImage(Patient::factory()->create()->user, 'avatar');
        $user = $this->withImage($user, 'cover');
        $avatar = $user->avatar_path;

        $this->as($user)->deleteJson('/api/v1/me/avatar')->assertOk()
            ->assertJsonPath('avatar_url', null)
            ->assertJsonPath('cover_url', $this->expectedUrl($user, 'cover'));

        Storage::disk('local')->assertMissing($avatar);
        $this->assertNull($user->fresh()->avatar_path);
        $this->as($user)->getJson("/api/v1/users/{$user->id}/avatar")->assertNotFound();

        // Remover o que ja nao existe nao e erro
        $this->as($user)->deleteJson('/api/v1/me/avatar')->assertOk()->assertJsonPath('avatar_url', null);
    }

    public function test_dono_ve_a_propria_imagem_com_tipo_certo_e_cache_privado(): void
    {
        $user = $this->withImage(Patient::factory()->create()->user, 'avatar');

        $response = $this->as($user)->get("/api/v1/users/{$user->id}/avatar")->assertOk();

        $response->assertHeader('Content-Type', 'image/png');
        $this->assertStringContainsString('private', $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('max-age=', $response->headers->get('Cache-Control'));
        $this->assertSame(base64_decode(self::PNG), $response->streamedContent());
    }

    public function test_sem_imagem_responde_404_e_usuario_inexistente_tambem(): void
    {
        $user = Patient::factory()->create()->user;

        $this->as($user)->getJson("/api/v1/users/{$user->id}/avatar")->assertNotFound();
        $this->as($user)->getJson("/api/v1/users/{$user->id}/cover")->assertNotFound();
        $this->as($user)->getJson('/api/v1/users/999999/avatar')->assertNotFound();
    }

    public function test_sem_token_responde_401(): void
    {
        $user = $this->withImage(Psychologist::factory()->approved()->create()->user, 'avatar');
        $this->app['auth']->forgetGuards();

        $this->withoutToken()->getJson("/api/v1/users/{$user->id}/avatar")->assertUnauthorized();
        $this->withoutToken()->postJson('/api/v1/me/avatar', ['image' => $this->png()])->assertUnauthorized();
        $this->withoutToken()->deleteJson('/api/v1/me/avatar')->assertUnauthorized();
    }

    public function test_foto_e_capa_de_psicologo_sao_visiveis_para_qualquer_usuario_ativo(): void
    {
        $psychologist = $this->withImage(Psychologist::factory()->published()->create()->user, 'avatar');
        $psychologist = $this->withImage($psychologist, 'cover');

        foreach ([Patient::factory()->create()->user, Psychologist::factory()->approved()->create()->user] as $viewer) {
            $this->as($viewer)->get("/api/v1/users/{$psychologist->id}/avatar")->assertOk();
            $this->as($viewer)->get("/api/v1/users/{$psychologist->id}/cover")->assertOk();
        }

        $suspended = Patient::factory()->create()->user;
        $suspended->update(['status' => 'suspended', 'suspended_at' => now()]);
        $this->as($suspended)->getJson("/api/v1/users/{$psychologist->id}/avatar")->assertForbidden();
    }

    public function test_psicologo_vinculado_ve_foto_do_paciente_em_vinculo_pendente_ativo_ou_encerrado(): void
    {
        foreach (['pending' => [], 'active' => ['status' => 'active', 'responded_at' => now(), 'accepted_at' => now()], 'ended' => ['status' => 'ended', 'responded_at' => now(), 'accepted_at' => now(), 'ended_at' => now()]] as $state) {
            $bond = Bond::factory()->create($state);
            $patient = $this->withImage($bond->patient->user, 'avatar');
            $patient = $this->withImage($patient, 'cover');

            $this->as($bond->psychologist->user)->get("/api/v1/users/{$patient->id}/avatar")->assertOk();
            $this->as($bond->psychologist->user)->get("/api/v1/users/{$patient->id}/cover")->assertOk();
        }
    }

    public function test_foto_do_paciente_e_negada_para_quem_nao_tem_vinculo_valido(): void
    {
        $patient = $this->withImage(Patient::factory()->create()->user, 'avatar');

        // Psicologo sem vinculo nenhum
        $this->as(Psychologist::factory()->approved()->create()->user)->getJson("/api/v1/users/{$patient->id}/avatar")->assertForbidden();

        // Solicitacao recusada: encerrada com resposta e sem aceite
        $rejected = Bond::factory()->create(['patient_id' => $patient->patient->id, 'status' => 'ended', 'responded_at' => now(), 'ended_at' => now()]);
        $this->as($rejected->psychologist->user)->getJson("/api/v1/users/{$patient->id}/avatar")->assertForbidden();

        // Outro paciente
        $this->as(Patient::factory()->create()->user)->getJson("/api/v1/users/{$patient->id}/avatar")->assertForbidden();
    }

    public function test_403_vem_antes_do_404_para_nao_revelar_se_o_paciente_tem_foto(): void
    {
        $patient = Patient::factory()->create()->user;

        $this->as(Psychologist::factory()->approved()->create()->user)->getJson("/api/v1/users/{$patient->id}/avatar")->assertForbidden();
    }

    public function test_admin_ve_foto_do_paciente(): void
    {
        $patient = $this->withImage(Patient::factory()->create()->user, 'avatar');

        $this->as(User::factory()->admin()->create())->get("/api/v1/users/{$patient->id}/avatar")->assertOk();
    }

    public function test_urls_aparecem_nos_resources_de_pessoa(): void
    {
        $bond = Bond::factory()->active()->create();
        $patient = $this->withImage($bond->patient->user, 'avatar');
        $psychologist = $this->withImage($bond->psychologist->user, 'cover');
        $avatar = $this->expectedUrl($patient, 'avatar');
        $cover = $this->expectedUrl($psychologist, 'cover');

        $this->as($patient)->getJson('/api/v1/patient/bonds')->assertOk()
            ->assertJsonPath('data.0.psychologist.avatar_url', null)
            ->assertJsonPath('data.0.psychologist.cover_url', $cover)
            ->assertJsonPath('data.0.psychologist.crp', $bond->psychologist->crp_region.'/'.$bond->psychologist->crp_number);

        $this->as($psychologist)->getJson('/api/v1/psychologist/patients')->assertOk()
            ->assertJsonPath('data.0.patient.id', $patient->id)
            ->assertJsonPath('data.0.patient.avatar_url', $avatar)
            ->assertJsonPath('data.0.patient.cover_url', null);
        $this->getJson("/api/v1/psychologist/patients/{$patient->id}")->assertOk()
            ->assertJsonPath('patient.avatar_url', $avatar);

        Appointment::create(['bond_id' => $bond->id, 'scheduled_at' => now()->addDay(), 'status' => 'scheduled', 'created_by_user_id' => $psychologist->id]);
        $this->getJson('/api/v1/psychologist/appointments')->assertOk()
            ->assertJsonPath('data.0.patient.id', $patient->id)
            ->assertJsonPath('data.0.patient.avatar_url', $avatar);
        $this->as($patient)->getJson('/api/v1/patient/appointments')->assertOk()
            ->assertJsonPath('data.0.psychologist.id', $bond->psychologist_id)
            ->assertJsonPath('data.0.psychologist.cover_url', $cover);

        $pending = Bond::factory()->create(['psychologist_id' => $bond->psychologist_id]);
        $requester = $this->withImage($pending->patient->user, 'avatar');
        $this->as($psychologist)->getJson('/api/v1/psychologist/bond-requests')->assertOk()
            ->assertJsonPath('data.0.patient.avatar_url', $this->expectedUrl($requester, 'avatar'))
            ->assertJsonPath('data.0.patient.cover_url', null);
    }

    public function test_catalogo_traz_as_urls_do_psicologo(): void
    {
        $published = Psychologist::factory()->published()->create(['profile_bio' => 'Bio fictícia']);
        $user = $this->withImage($published->user, 'avatar');

        $this->as(Patient::factory()->create()->user)->getJson('/api/v1/catalog/psychologists')->assertOk()
            ->assertJsonPath('data.0.id', $published->id)
            ->assertJsonPath('data.0.avatar_url', $this->expectedUrl($user, 'avatar'))
            ->assertJsonPath('data.0.cover_url', null);
    }
}
