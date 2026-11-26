<?php

namespace Tests\Feature;

use Tests\TestCase;

// Na hospedagem o HTTPS termina no proxy, e o Laravel recebe a requisicao em HTTP.
// Sem confiar no X-Forwarded-Proto, redirects e action de formulario do painel saem em http://.
class TrustedProxyTest extends TestCase
{
    public function test_redirect_keeps_https_when_proxy_says_the_request_was_https(): void
    {
        $response = $this->withHeaders([
            'X-Forwarded-Proto' => 'https',
            'X-Forwarded-Host' => 'calmind.example.com',
            'X-Forwarded-Port' => '443',
        ])->get('/psychologist/tasks');

        $response->assertRedirect('https://calmind.example.com/psychologist/login');
    }
}
