<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

// Contrato 2.3: todo erro de /api sai como {"message", "errors"?}. Nenhum Controller monta erro na mao.
class ApiErrorRenderer
{
    private const GENERIC = 'Ocorreu um erro interno. Tente novamente mais tarde.';

    private const UNAUTHENTICATED = 'Não autenticado. Entre para continuar.';

    // Mensagens fixas para os status que o proprio framework lanca em ingles. A do 404 e fixa
    // tambem porque a do Laravel cita o nome da Model (RNF-10, RNF-40).
    private const FIXED = [
        400 => 'Requisição inválida.',
        401 => self::UNAUTHENTICATED,
        403 => 'Você não tem permissão para realizar esta ação.',
        404 => 'Recurso não encontrado.',
        405 => 'Método não permitido para este recurso.',
        413 => 'Os dados enviados são grandes demais.',
        415 => 'Tipo de conteúdo não suportado.',
        419 => 'Sessão expirada. Tente novamente.',
        429 => 'Muitas tentativas. Tente novamente em instantes.',
    ];

    public static function render(Throwable $e, Request $request): ?JsonResponse
    {
        if (! ($request->is('api/*') || $request->expectsJson()) || $e instanceof HttpResponseException) {
            return null;
        }

        if ($e instanceof ValidationException) {
            return response()->json([
                'message' => 'Os dados enviados são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }

        if ($e instanceof AuthenticationException) {
            // A mensagem do framework e em ingles; so a de credencial invalida e escrita por nos
            $message = $e instanceof InvalidCredentialsException ? $e->getMessage() : self::UNAUTHENTICATED;

            return response()->json(['message' => $message], 401);
        }

        // ModelNotFoundException e AuthorizationException ja chegam aqui convertidas em 404 e 403
        if ($e instanceof HttpExceptionInterface) {
            return response()->json(
                ['message' => self::messageFor($e)],
                $e->getStatusCode(),
                $e->getHeaders()
            );
        }

        // Qualquer outro erro: resposta generica mesmo com APP_DEBUG ligado. O detalhe segue para o log.
        return response()->json(['message' => self::GENERIC], 500);
    }

    // Fora da tabela fixa, a mensagem e a que o Service escreveu (409 de conflito de estado, por exemplo)
    private static function messageFor(HttpExceptionInterface $e): string
    {
        $status = $e->getStatusCode();

        if ($e instanceof ApiException && $status < 500) {
            return $e->getMessage();
        }

        if (isset(self::FIXED[$status])) {
            return self::FIXED[$status];
        }

        if ($status >= 500 || $e->getMessage() === '') {
            return self::GENERIC;
        }

        return $e->getMessage();
    }
}
