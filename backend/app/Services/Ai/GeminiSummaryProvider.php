<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// Gemini Developer API (Google AI Studio): POST {base}/models/{model}:generateContent com a chave no
// cabecalho x-goog-api-key. A chave vem do .env e nunca aparece em log, URL ou resposta.
class GeminiSummaryProvider implements SummaryProvider
{
    public function name(): string
    {
        return 'gemini:'.config('services.gemini.model');
    }

    public function summarize(array $reports): string
    {
        $key = (string) config('services.gemini.key');
        if ($key === '') {
            throw new AiUnavailableException('GEMINI_API_KEY nao configurada.');
        }

        $url = rtrim((string) config('services.gemini.base_url'), '/').'/models/'.config('services.gemini.model').':generateContent';

        try {
            $response = Http::withHeaders(['x-goog-api-key' => $key])
                ->withOptions(['verify' => config('services.ai.ca_bundle') ?: true])
                ->timeout((int) config('services.ai.timeout'))
                ->retry(1, 500, throw: false)
                ->post($url, [
                    'system_instruction' => ['parts' => [['text' => SummaryPrompt::system()]]],
                    'contents' => [['role' => 'user', 'parts' => [['text' => SummaryPrompt::user($reports)]]]],
                    'generationConfig' => ['temperature' => 0.3, 'maxOutputTokens' => 1500],
                ]);
        } catch (ConnectionException $e) {
            throw new AiUnavailableException('Sem conexao com o Gemini.', 0, $e);
        }

        if (! $response->successful()) {
            // so o status e a mensagem de erro do Google: nada do que foi enviado
            Log::warning('Gemini recusou a chamada', ['status' => $response->status(), 'erro' => $response->json('error.message')]);
            throw new AiUnavailableException('Gemini respondeu '.$response->status().'.');
        }

        $text = trim((string) $response->json('candidates.0.content.parts.0.text'));
        if ($text === '') {
            Log::warning('Gemini sem texto', ['motivo' => $response->json('promptFeedback.blockReason') ?? $response->json('candidates.0.finishReason')]);
            throw new AiUnavailableException('Gemini nao devolveu texto.');
        }

        return $text;
    }
}
