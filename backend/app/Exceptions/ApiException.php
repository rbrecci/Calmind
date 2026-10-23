<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

// Erro de regra de negocio lancado pelo Service: o ApiErrorRenderer preserva a mensagem (abaixo de 500)
class ApiException extends HttpException
{
    public function __construct(int $status, string $message)
    {
        parent::__construct($status, $message);
    }
}
