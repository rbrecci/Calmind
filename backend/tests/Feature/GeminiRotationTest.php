<?php

namespace Tests\Feature;

use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\GeminiSummaryProvider;
use App\Services\Ai\KeyList;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

// Rodizio de chaves e de modelos do Gemini (todas as chaves sao de contas do dono do projeto).
// Nenhuma chamada real: Http::fake decide a resposta pela chave e pelo modelo da requisicao.
class GeminiRotationTest extends TestCase
{
    private const REPORTS = [['date' => '2026-11-26', 'body' => 'Relato de teste']];

    private array $sent = [];

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.gemini.keys' => ['KEY-A-segredo', 'KEY-B-segredo'], 'services.gemini.models' => ['modelo-1', 'modelo-2']]);
    }

    /** @param array<string, array{int, string|null}> $plan "chave|modelo" => [status, texto] ; ausente = 200 com texto padrao */
    private function plan(array $plan): void
    {
        $this->sent = [];
        Http::swap(new HttpFactory);
        Http::fake(function (Request $request) use ($plan) {
            $key = $request->header('x-goog-api-key')[0];
            preg_match('#/models/([^:]+):#', $request->url(), $m);
            $this->sent[] = $key.'|'.$m[1];
            [$status, $text] = $plan[$key.'|'.$m[1]] ?? $plan[$key.'|*'] ?? [200, 'Resumo ok'];

            return $status === 200
                ? Http::response(['candidates' => [['content' => ['parts' => [['text' => (string) $text]]]]]])
                : Http::response(['error' => ['message' => $text ?? 'falha']], $status);
        });
    }

    private function summarize(): string
    {
        return (new GeminiSummaryProvider)->summarize(self::REPORTS);
    }

    public function test_quota_on_first_key_falls_to_the_second_key(): void
    {
        $this->plan(['KEY-A-segredo|*' => [429, 'quota']]);

        $this->assertSame('Resumo ok', $this->summarize());
        // a chave A falhou nos dois modelos antes de a B responder
        $this->assertSame(['KEY-A-segredo|modelo-1', 'KEY-A-segredo|modelo-2', 'KEY-B-segredo|modelo-1'], $this->sent);
    }

    public function test_overloaded_model_falls_to_the_next_model_on_the_same_key(): void
    {
        $this->plan(['KEY-A-segredo|modelo-1' => [503, 'high demand']]);

        $this->assertSame('Resumo ok', $this->summarize());
        $this->assertSame(['KEY-A-segredo|modelo-1', 'KEY-A-segredo|modelo-2'], $this->sent);
    }

    public function test_a_failed_pair_rests_and_the_next_call_skips_it(): void
    {
        $this->plan(['KEY-A-segredo|*' => [429, 'quota']]);
        $this->summarize();

        $this->plan(['KEY-A-segredo|*' => [429, 'quota']]);
        $this->summarize();

        $this->assertSame(['KEY-B-segredo|modelo-1'], $this->sent, 'o par em descanso nao deve ser tentado de novo');
    }

    public function test_rejected_key_rests_for_every_model(): void
    {
        $this->plan(['KEY-A-segredo|*' => [400, 'API key not valid. Please pass a valid API key.']]);
        $this->summarize();

        $this->plan([]);
        $this->summarize();

        $this->assertSame(['KEY-B-segredo|modelo-1'], $this->sent);
    }

    public function test_when_everything_fails_it_throws_without_exposing_any_key(): void
    {
        $this->plan(['KEY-A-segredo|*' => [429, 'quota'], 'KEY-B-segredo|*' => [503, 'high demand']]);

        try {
            $this->summarize();
            $this->fail('deveria lancar');
        } catch (AiUnavailableException $e) {
            $this->assertStringNotContainsString('segredo', $e->getMessage());
        }
        $this->assertCount(4, $this->sent);
    }

    public function test_all_resting_pairs_are_still_tried_because_the_rest_is_only_a_guess(): void
    {
        $this->plan(['KEY-A-segredo|*' => [429, 'quota'], 'KEY-B-segredo|*' => [429, 'quota']]);
        try {
            $this->summarize();
        } catch (AiUnavailableException) {
        }

        $this->plan([]);

        $this->assertSame('Resumo ok', $this->summarize());
    }

    public function test_content_block_does_not_rotate_keys(): void
    {
        $this->plan(['KEY-A-segredo|*' => [200, '']]);

        $this->expectException(AiUnavailableException::class);
        try {
            $this->summarize();
        } finally {
            $this->assertSame(['KEY-A-segredo|modelo-1'], $this->sent);
        }
    }

    public function test_no_key_configured_fails_fast_without_calling_anything(): void
    {
        config(['services.gemini.keys' => []]);
        Http::fake();

        $this->expectException(AiUnavailableException::class);
        try {
            $this->summarize();
        } finally {
            Http::assertNothingSent();
        }
    }

    public function test_key_list_merges_single_key_and_list_without_blanks_or_duplicates(): void
    {
        $this->assertSame(['K1', 'K2', 'K3'], KeyList::merge('K1', ' K2 , K1 ,,K3'));
        $this->assertSame(['K2'], KeyList::merge(null, 'K2'));
        $this->assertSame(['K1'], KeyList::merge('K1', null));
        $this->assertSame([], KeyList::merge(null, ''));
    }
}
