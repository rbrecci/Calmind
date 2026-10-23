<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
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
