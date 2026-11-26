<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// Gemini Developer API (Google AI Studio): POST {base}/models/{model}:generateContent com a chave no
// cabecalho x-goog-api-key. As chaves vem do .env e nunca aparecem em log, URL ou resposta: nos logs
// elas sao "chave #n". Rodizio: para cada chave, cada modelo, na ordem configurada; o par que falha
// (cota, sobrecarga, chave invalida) fica em descanso e e pulado nas chamadas seguintes.
class GeminiSummaryProvider implements SummaryProvider
{
    // descanso por tipo de falha, em segundos
    private const REST_QUOTA = 600;     // 429: a cota volta devagar

    private const REST_OVERLOAD = 120;  // 5xx, tempo esgotado, sem conexao

    private const REST_INVALID = 1800;  // chave recusada ou modelo inexistente

    public function name(): string
    {
        return 'gemini ('.count($this->keys()).' chave(s), '.count($this->models()).' modelo(s))';
    }

    public function summarize(array $reports): string
    {
        $keys = $this->keys();
        if ($keys === []) {
            throw new AiUnavailableException('Nenhuma GEMINI_API_KEY configurada.');
        }

        $pairs = $this->orderedPairs($keys);
        $deadline = microtime(true) + (int) config('services.ai.budget');
        $failures = [];

        foreach ($pairs as [$k, $model]) {
            if (microtime(true) >= $deadline) {
                $failures[] = 'orcamento de tempo esgotado';
                break;
            }

            try {
                $response = $this->call($keys[$k], $model, $reports);
            } catch (ConnectionException) {
                $this->rest($k, $model, self::REST_OVERLOAD);
                $failures[] = "chave #".($k + 1)." {$model}: sem conexao ou tempo esgotado";

                continue;
            }

            if ($response->successful()) {
                $text = trim((string) $response->json('candidates.0.content.parts.0.text'));
                if ($text !== '') {
                    return $text;
                }
                // sem texto = bloqueio de seguranca do conteudo: outra chave devolveria o mesmo, entao nao roda o rodizio
                Log::warning('Gemini sem texto', ['motivo' => $response->json('promptFeedback.blockReason') ?? $response->json('candidates.0.finishReason')]);
                throw new AiUnavailableException('Gemini nao devolveu texto.');
            }

            $failures[] = $this->classify($response, $k, $model);
        }

        // so status e motivo tecnico: nada do que foi enviado e nenhuma chave
        Log::warning('Gemini: todas as tentativas falharam', ['tentativas' => $failures]);
        throw new AiUnavailableException('Todas as chaves e modelos falharam: '.implode(' | ', array_slice($failures, -3)));
    }

    private function call(string $key, string $model, array $reports): Response
    {
        $url = rtrim((string) config('services.gemini.base_url'), '/')."/models/{$model}:generateContent";

        return Http::withHeaders(['x-goog-api-key' => $key])
            ->withOptions(['verify' => config('services.ai.ca_bundle') ?: true])
            ->timeout((int) config('services.ai.timeout'))
            ->post($url, [
                'system_instruction' => ['parts' => [['text' => SummaryPrompt::system()]]],
                'contents' => [['role' => 'user', 'parts' => [['text' => SummaryPrompt::user($reports)]]]],
                'generationConfig' => ['temperature' => 0.3, 'maxOutputTokens' => 1500],
            ]);
    }

    // poe o par (ou a chave inteira) em descanso e devolve a descricao para o log
    private function classify(Response $response, int $k, string $model): string
    {
        $status = $response->status();
        $message = (string) $response->json('error.message');
        $label = 'chave #'.($k + 1)." {$model}: {$status}";

        if (in_array($status, [401, 403], true) || ($status === 400 && stripos($message, 'api key') !== false)) {
            $this->restKey($k, self::REST_INVALID);
        } elseif ($status === 429) {
            $this->rest($k, $model, self::REST_QUOTA);
        } elseif ($status === 404 || $status === 400) {
            $this->rest($k, $model, self::REST_INVALID);
        } else {
            $this->rest($k, $model, self::REST_OVERLOAD);
        }

        return $label.($message !== '' ? ' '.mb_substr($message, 0, 80) : '');
    }

    /** @return list<array{0: int, 1: string}> pares [indice da chave, modelo]; os em descanso vao para o fim */
    private function orderedPairs(array $keys): array
    {
        $ready = [];
        $resting = [];

        foreach (array_keys($keys) as $k) {
            foreach ($this->models() as $model) {
                if (Cache::has($this->restKeyName($k, $model)) || Cache::has($this->restKeyName($k, '*'))) {
                    $resting[] = [$k, $model];
                } else {
                    $ready[] = [$k, $model];
                }
            }
        }

        // se tudo esta em descanso ainda vale tentar, porque o descanso e palpite e o servico pode ter voltado
        return array_merge($ready, $resting);
    }

    private function rest(int $k, string $model, int $seconds): void
    {
        Cache::put($this->restKeyName($k, $model), 1, $seconds);
    }

    private function restKey(int $k, int $seconds): void
    {
        Cache::put($this->restKeyName($k, '*'), 1, $seconds);
    }

    // o nome nao carrega a chave: so a posicao dela na lista e o modelo
    private function restKeyName(int $k, string $model): string
    {
        return "ai:gemini:rest:{$k}:{$model}";
    }

    /** @return list<string> */
    private function keys(): array
    {
        return config('services.gemini.keys', []);
    }

    /** @return list<string> */
    private function models(): array
    {
        return config('services.gemini.models', []);
    }
}
