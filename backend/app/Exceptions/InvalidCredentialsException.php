<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;

// CA-02.2: uma mensagem so para e-mail inexistente, senha errada e conta suspensa
class InvalidCredentialsException extends AuthenticationException
{
    public function __construct()
    {
        parent::__construct('Credenciais inválidas.');
    }
}
