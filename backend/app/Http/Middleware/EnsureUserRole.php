<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    // RF-05 e RN-51: o papel e o estado atual da conta decidem o acesso, inclusive com sessao antiga.
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        abort_unless(
            $request->user()?->status === 'active' && in_array($request->user()->role, $roles, true),
            403
        );

        return $next($request);
    }
}
