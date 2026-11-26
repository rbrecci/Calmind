<?php

namespace App\Services\Ai;

use RuntimeException;

// A mensagem e tecnica e vai so para o log: nunca para o usuario e nunca com conteudo de relato (CA-41.5)
class AiUnavailableException extends RuntimeException {}
