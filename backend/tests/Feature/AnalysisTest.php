<?php

namespace Tests\Feature;

use App\Models\Analysis;
use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Notification;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// RF-04 (efeito na analise), RF-41 e RF-42. O servico de IA e sempre simulado aqui (Http::fake):
// o teste contra o Gemini de verdade e o comando `php artisan ai:check`.
class AnalysisTest extends TestCase
{
    use RefreshDatabase;

    private const URL = '/api/v1/psychologist/analyses';

    private Bond $bond;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.ai.provider' => 'gemini', 'services.gemini.key' => 'chave-de-teste']);
        $this->fakeGemini('- Ansiedade antes da prova.');

        $this->bond = Bond::factory()->active()->create();
        $this->consent('general');
        $this->consent('ai_analysis');
        Report::factory()->forBond($this->bond)->create(['body' => 'COMPARTILHADO-1 dormi mal esta semana']);
        Report::factory()->forBond($this->bond)->create(['body' => 'COMPARTILHADO-2 conversei com um amigo']);
        Report::factory()->forBond($this->bond)->private()->create(['body' => 'MARCADOR-PRIVADO segredo que ninguem le']);
        Report::factory()->forBond($this->bond)->unpublished()->create(['body' => 'MARCADOR-DESPUBLICADO retirado']);
    }

    private function fakeGemini(string $text, int $status = 200): void
    {
        // Http::fake acumula: sem trocar o factory, o primeiro stub continuaria valendo
        Http::swap(new HttpFactory);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(
            $status === 200 ? ['candidates' => [['content' => ['parts' => [['text' => $text]]]]]] : ['error' => ['message' => 'falha']],
            $status,
        )]);
    }

    private function consent(string $type): ConsentAcceptance
    {
        $term = ConsentTerm::firstOrCreate(['type' => $type, 'version' => '1.0'], [
            'body' => 'Termo de teste',
            'effective_from' => now()->subDay(),
            'published_by_user_id' => User::factory()->admin()->create()->id,
        ]);

        return ConsentAcceptance::create(['user_id' => $this->bond->patient->user_id, 'consent_term_id' => $term->id]);
    }

    private function as(User $user): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($user->createToken('mobile')->plainTextToken);
    }

    private function psy(): User
    {
        return $this->bond->psychologist->user;
    }

    private function body(): array
    {
        return ['bond_id' => $this->bond->id, 'period_start' => now()->subDays(7)->toDateString(), 'period_end' => now()->toDateString()];
    }

    private function generate(): int
    {
        return $this->as($this->psy())->postJson(self::URL, $this->body())->assertCreated()->json('id');
    }

    public function test_request_sends_only_shared_reports_and_returns_an_unconfirmed_labelled_suggestion(): void
    {
        $response = $this->as($this->psy())->postJson(self::URL, $this->body())->assertCreated();

        $response->assertJsonPath('status', 'generated')
            ->assertJsonPath('origin', 'ai_suggestion')
            ->assertJsonPath('summary', '- Ansiedade antes da prova.')
            ->assertJsonPath('label', 'Resumo baseado apenas nos relatos compartilhados pelo paciente. Sugestão gerada por IA: revise antes de confirmar.');
        $this->assertDatabaseCount('analysis_reports', 2);

        Http::assertSent(function (Request $request) {
            $sent = json_encode($request->data(), JSON_UNESCAPED_UNICODE);

            return $request->hasHeader('x-goog-api-key', 'chave-de-teste')
                && str_contains($sent, 'COMPARTILHADO-1') && str_contains($sent, 'COMPARTILHADO-2')
                && ! str_contains($sent, 'MARCADOR-')
                // minimizacao: nem o nome nem o e-mail do paciente vao para o servico de IA
                && ! str_contains($sent, $this->bond->patient->user->name)
                && ! str_contains($sent, $this->bond->patient->user->email);
        });
    }

    public function test_without_vigent_ai_consent_nothing_is_read_or_sent(): void
    {
        $acceptance = $this->bond->patient->user->consentAcceptances()
            ->whereHas('consentTerm', fn ($q) => $q->where('type', 'ai_analysis'))->first();
        $acceptance->update(['revoked_at' => now()]);

        $this->as($this->psy())->postJson(self::URL, $this->body())->assertForbidden();

        Http::assertNothingSent();
        $this->assertDatabaseCount('analyses', 0);
    }

    public function test_no_shared_reports_in_the_period_is_refused_without_calling_ai(): void
    {
        $this->as($this->psy())->postJson(self::URL, [
            'bond_id' => $this->bond->id, 'period_start' => now()->subDays(30)->toDateString(), 'period_end' => now()->subDays(20)->toDateString(),
        ])->assertStatus(422);

        Http::assertNothingSent();
    }

    public function test_ai_failure_saves_nothing_and_does_not_leak_the_reason(): void
    {
        $this->fakeGemini('', 500);

        $response = $this->as($this->psy())->postJson(self::URL, $this->body())->assertStatus(502);

        $this->assertStringNotContainsString('chave', $response->getContent());
        $this->assertDatabaseCount('analyses', 0);
        $this->assertDatabaseCount('analysis_reports', 0);
    }

    public function test_ai_is_never_called_without_an_explicit_request(): void
    {
        // criar relato, abrir notificacoes e listar pacientes nao aciona nada (CA-41.2)
        Report::factory()->forBond($this->bond)->create(['body' => 'novo relato']);
        $this->as($this->bond->patient->user)->getJson('/api/v1/notifications')->assertOk();
        $this->as($this->psy())->getJson('/api/v1/psychologist/patients')->assertOk();

        Http::assertNothingSent();
    }

    public function test_confirming_incorporates_the_summary_with_author_and_origin(): void
    {
        $id = $this->generate();

        $this->as($this->psy())->postJson(self::URL."/{$id}/confirm")
            ->assertOk()->assertJsonPath('status', 'confirmed')
            ->assertJsonPath('origin', 'ai_suggestion')
            ->assertJsonPath('summary', '- Ansiedade antes da prova.')
            ->assertJsonPath('confirmed_by_user_id', $this->psy()->id)
            ->assertJsonCount(1, 'versions');
        $this->as($this->psy())->getJson(self::URL."?bond_id={$this->bond->id}")->assertOk()->assertJsonPath('meta.total', 1);
    }

    public function test_confirming_with_an_edited_text_keeps_the_edited_version(): void
    {
        $id = $this->generate();

        $this->as($this->psy())->postJson(self::URL."/{$id}/confirm", ['body' => 'Texto ajustado pelo psicólogo'])
            ->assertOk()->assertJsonPath('summary', 'Texto ajustado pelo psicólogo');
    }

    public function test_editing_after_confirmation_preserves_previous_versions(): void
    {
        $id = $this->generate();
        $this->as($this->psy())->postJson(self::URL."/{$id}/confirm")->assertOk();

        $response = $this->as($this->psy())->putJson(self::URL."/{$id}", ['body' => 'Segunda versão'])
            ->assertOk()->assertJsonPath('summary', 'Segunda versão')->assertJsonCount(2, 'versions');

        $this->assertSame('- Ansiedade antes da prova.', $response->json('versions.0.body'));
        $this->as($this->psy())->putJson(self::URL."/{$id}", [])->assertUnprocessable();
    }

    public function test_discarding_erases_the_text_and_leaves_no_trace_in_any_query(): void
    {
        $id = $this->generate();

        $this->as($this->psy())->postJson(self::URL."/{$id}/discard")->assertOk();

        $this->assertNull(Analysis::find($id)->summary_raw);
        $this->assertDatabaseCount('analysis_reports', 0);
        $this->as($this->psy())->getJson(self::URL."/{$id}")->assertNotFound();
        $this->as($this->psy())->getJson(self::URL)->assertJsonPath('meta.total', 0);
        $this->as($this->psy())->postJson(self::URL."/{$id}/confirm")->assertNotFound();
    }

    public function test_an_unreviewed_suggestion_expires_and_is_not_available_later(): void
    {
        $id = $this->generate();

        $this->travel(61)->minutes();

        $this->as($this->psy())->getJson(self::URL."/{$id}")->assertNotFound();
        $this->assertNull(Analysis::find($id)->summary_raw);
        $this->assertSame('discarded', Analysis::find($id)->status);
    }

    public function test_unconfirmed_suggestion_is_not_in_the_list_and_never_reaches_the_patient(): void
    {
        $id = $this->generate();

        $this->as($this->psy())->getJson(self::URL)->assertJsonPath('meta.total', 0);
        $this->as($this->bond->patient->user)->getJson(self::URL."/{$id}")->assertForbidden();
        $this->as($this->bond->patient->user)->postJson(self::URL, $this->body())->assertForbidden();
        $this->as($this->bond->patient->user)->getJson('/api/v1/patient/reports')->assertOk()->assertDontSee('Ansiedade antes da prova');
        $this->assertSame(0, Notification::where('user_id', $this->bond->patient->user_id)->count());
    }

    public function test_other_psychologist_cannot_request_or_read_and_the_attempt_is_audited(): void
    {
        $id = $this->generate();
        $stranger = Bond::factory()->active()->create()->psychologist->user;

        $this->as($stranger)->postJson(self::URL, $this->body())->assertNotFound();
        $this->as($stranger)->getJson(self::URL."/{$id}")->assertNotFound();

        $this->assertDatabaseHas('audit_logs', ['actor_user_id' => $stranger->id, 'action' => 'request_analysis', 'result' => 'denied']);
        $this->assertDatabaseHas('audit_logs', ['actor_user_id' => $stranger->id, 'action' => 'read_analysis', 'result' => 'denied']);
        $this->assertDatabaseHas('audit_logs', ['actor_user_id' => $this->psy()->id, 'action' => 'request_analysis', 'result' => 'allowed']);
    }

    public function test_period_validation(): void
    {
        $this->as($this->psy())->postJson(self::URL, array_merge($this->body(), ['period_start' => now()->subDays(60)->toDateString()]))->assertStatus(422);
        $this->as($this->psy())->postJson(self::URL, array_merge($this->body(), ['period_end' => now()->addDay()->toDateString()]))->assertUnprocessable();
        Http::assertNothingSent();
    }

    public function test_simulated_provider_is_labelled_as_not_real_ai(): void
    {
        config(['services.ai.provider' => 'simulated']);

        $this->as($this->psy())->postJson(self::URL, $this->body())->assertCreated()->assertSee('SIMULADO');
        Http::assertNothingSent();
    }
}
