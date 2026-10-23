<?php

namespace Tests\Feature;

use App\Exceptions\ApiException;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

// Contrato 2.3: erro de regra de negocio com mensagem escrita pelo Service (403 e 409 incluidos)
class ApiExceptionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('api')->get('api/v1/_probe/forbidden', fn () => throw new ApiException(403, 'Cadastro pendente de aprovação.'));
        Route::middleware('api')->get('api/v1/_probe/conflict', fn () => throw new ApiException(409, 'Já existe um vínculo ativo.'));
        Route::middleware('api')->get('api/v1/_probe/server', fn () => throw new ApiException(500, 'detalhe interno: tabela users'));
    }

    public function test_403_keeps_the_message_written_by_the_service(): void
    {
        $this->getJson('api/v1/_probe/forbidden')
            ->assertForbidden()
            ->assertExactJson(['message' => 'Cadastro pendente de aprovação.']);
    }

    public function test_409_keeps_the_message(): void
    {
        $this->getJson('api/v1/_probe/conflict')
            ->assertStatus(409)
            ->assertExactJson(['message' => 'Já existe um vínculo ativo.']);
    }

    public function test_5xx_never_leaks_the_message(): void
    {
        $response = $this->getJson('api/v1/_probe/server')->assertStatus(500);

        $this->assertStringNotContainsString('tabela users', $response->getContent());
    }
}
