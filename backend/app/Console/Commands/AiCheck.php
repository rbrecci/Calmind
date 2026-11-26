<?php

namespace App\Console\Commands;

use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\SummaryProvider;
use Illuminate\Console\Command;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

// Confere a ligacao com o servico de IA com um texto FICTICIO. Nunca le o banco e nunca mostra chave:
// nas saidas cada chave e "chave #n", a posicao dela em GEMINI_API_KEY / GEMINI_API_KEYS.
class AiCheck extends Command
{
    protected $signature = 'ai:check
        {--models : lista os modelos Gemini que aceitam generateContent (com a primeira chave)}
        {--keys : testa cada chave e cada modelo configurado, um por um, sem rodizio}';

    protected $description = 'Testa a conexao com o servico de IA usando um relato ficticio';

    public function handle(SummaryProvider $provider): int
    {
        $this->line('Provedor: '.$provider->name());

        if ($this->option('models')) {
            return $this->listModels();
        }

        if ($this->option('keys')) {
            return $this->checkEachKey();
        }

        try {
            $text = $provider->summarize([
                ['date' => now()->toDateString(), 'body' => 'Relato de teste, ficticio: dormi mal durante a semana e fiquei ansioso antes da prova, mas conversei com um amigo e me senti melhor.'],
            ]);
        } catch (AiUnavailableException $e) {
            $this->error('Falhou: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Conectou (com rodizio). Resposta de teste:');
        $this->line($text);

        return self::SUCCESS;
    }

    // diagnostico: mostra qual conta ou modelo esta falhando, que o rodizio esconderia
    private function checkEachKey(): int
    {
        $keys = config('services.gemini.keys', []);
        $models = config('services.gemini.models', []);
        if ($keys === []) {
            $this->error('Nenhuma GEMINI_API_KEY configurada.');

            return self::FAILURE;
        }

        $allOk = true;
        foreach ($keys as $k => $key) {
            foreach ($models as $model) {
                try {
                    $response = Http::withHeaders(['x-goog-api-key' => $key])
                        ->withOptions(['verify' => config('services.ai.ca_bundle') ?: true])
                        ->timeout((int) config('services.ai.timeout'))
                        ->post(rtrim((string) config('services.gemini.base_url'), '/')."/models/{$model}:generateContent", [
                            'contents' => [['role' => 'user', 'parts' => [['text' => 'Responda apenas: ok']]]],
                            'generationConfig' => ['maxOutputTokens' => 20],
                        ]);
                    $ok = $response->successful();
                    $result = $ok ? 'OK' : $response->status().' '.mb_substr((string) $response->json('error.message'), 0, 90);
                } catch (ConnectionException) {
                    $ok = false;
                    $result = 'sem conexao ou tempo esgotado';
                }
                $allOk = $allOk && $ok;
                $this->line(sprintf('chave #%d | %s | %s', $k + 1, $model, $result));
            }
        }

        return $allOk ? self::SUCCESS : self::FAILURE;
    }

    private function listModels(): int
    {
        $key = config('services.gemini.keys.0');
        if (! $key) {
            $this->error('Nenhuma GEMINI_API_KEY configurada.');

            return self::FAILURE;
        }

        $response = Http::withHeaders(['x-goog-api-key' => $key])->withOptions(['verify' => config('services.ai.ca_bundle') ?: true])
            ->get(rtrim((string) config('services.gemini.base_url'), '/').'/models?pageSize=200');
        if (! $response->successful()) {
            $this->error('Gemini respondeu '.$response->status().': '.$response->json('error.message'));

            return self::FAILURE;
        }

        collect($response->json('models', []))
            ->filter(fn ($model) => in_array('generateContent', $model['supportedGenerationMethods'] ?? [], true))
            ->each(fn ($model) => $this->line(str_replace('models/', '', $model['name'])));

        return self::SUCCESS;
    }
}
