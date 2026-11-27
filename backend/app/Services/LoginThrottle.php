<?php

namespace App\Services;

use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Support\Facades\RateLimiter;

// Limite de tentativas de login (API e painel web). So a falha conta, e o acerto zera.
// Duas chaves: e-mail + IP segura a rajada; so o e-mail segura quem troca de IP (o cabecalho
// X-Forwarded-For e confiado de qualquer origem, ver bootstrap/app.php)
class LoginThrottle
{
    /** @return array<string, array{0: int, 1: int}> chave => [maximo, janela em segundos] */
    private function limits(string $email, ?string $ip): array
    {
        $email = strtolower(trim($email));

        return [
            'login:'.sha1($email.'|'.$ip) => [config('calmind.auth.login_max_attempts'), 60],
            'login-account:'.sha1($email) => [config('calmind.auth.login_account_max_attempts'), 900],
        ];
    }

    public function ensureAllowed(string $email, ?string $ip): void
    {
        foreach ($this->limits($email, $ip) as $key => [$max]) {
            if (RateLimiter::tooManyAttempts($key, $max)) {
                throw new ThrottleRequestsException('', null, ['Retry-After' => RateLimiter::availableIn($key)]);
            }
        }
    }

    public function hit(string $email, ?string $ip): void
    {
        foreach ($this->limits($email, $ip) as $key => [, $seconds]) {
            RateLimiter::hit($key, $seconds);
        }
    }

    public function clear(string $email, ?string $ip): void
    {
        foreach (array_keys($this->limits($email, $ip)) as $key) {
            RateLimiter::clear($key);
        }
    }
}
