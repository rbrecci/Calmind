<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveAccount
{
    // RN-51: rota sem papel fixo tambem barra conta nao ativa, com o mesmo 403 de EnsureUserRole
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->status === 'active', 403);

        return $next($request);
    }
}
