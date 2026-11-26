<?php

namespace App\Providers;

use App\Services\Ai\GeminiSummaryProvider;
use App\Services\Ai\SimulatedSummaryProvider;
use App\Services\Ai\SummaryProvider;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // RF-41: o servico de IA e escolhido em AI_PROVIDER (gemini | simulated)
        $this->app->bind(SummaryProvider::class, fn () => match (config('services.ai.provider')) {
            'gemini' => new GeminiSummaryProvider,
            'simulated' => new SimulatedSummaryProvider,
            default => throw new InvalidArgumentException('AI_PROVIDER invalido: '.config('services.ai.provider')),
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // RNF-09: o Guard chama este callback antes de gravar last_used_at, entao a janela
        // de inatividade conta do uso anterior (ou da criacao, se o token nunca foi usado)
        Sanctum::authenticateAccessTokensUsing(function ($accessToken, bool $isValid) {
            $lastActivity = $accessToken->last_used_at ?? $accessToken->created_at;

            return $isValid
                && $lastActivity->gt(now()->subMinutes(config('calmind.auth.inactivity_minutes')));
        });
    }
}
