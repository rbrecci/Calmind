<?php

namespace App\Console\Commands;

use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\SummaryProvider;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

// Confere a ligacao com o servico de IA com um texto FICTICIO. Nunca le o banco e nunca mostra a chave.
class AiCheck extends Command
{
    protected $signature = 'ai:check {--models : lista os modelos Gemini que aceitam generateContent}';

    protected $description = 'Testa a conexao com o servico de IA usando um relato ficticio';

    public function handle(SummaryProvider $provider): int
    {
        $this->line('Provedor: '.$provider->name());

        if ($this->option('models')) {
            return $this->listModels();
        }

        try {
            $text = $provider->summarize([
                ['date' => now()->toDateString(), 'body' => 'Relato de teste, ficticio: dormi mal durante a semana e fiquei ansioso antes da prova, mas conversei com um amigo e me senti melhor.'],
            ]);
        } catch (AiUnavailableException $e) {
            $this->error('Falhou: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info('Conectou. Resposta de teste:');
        $this->line($text);

        return self::SUCCESS;
    }

    private function listModels(): int
    {
        $key = (string) config('services.gemini.key');
        if ($key === '') {
            $this->error('GEMINI_API_KEY nao configurada.');

            return self::FAILURE;
        }

        $response = Http::withHeaders(['x-goog-api-key' => $key])->withOptions(['verify' => config('services.ai.ca_bundle') ?: true])->get(rtrim((string) config('services.gemini.base_url'), '/').'/models?pageSize=200');
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
