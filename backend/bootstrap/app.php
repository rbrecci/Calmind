<?php

use App\Exceptions\ApiErrorRenderer;
use App\Http\Middleware\EnsureActiveAccount;
use App\Http\Middleware\EnsureUserRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // A hospedagem termina o HTTPS no proxy dela, que muda de IP; por isso '*'.
        $middleware->trustProxies(at: '*');
        $middleware->alias(['role' => EnsureUserRole::class, 'active' => EnsureActiveAccount::class]);
        $middleware->redirectGuestsTo(fn (Request $request): string => $request->is('psychologist/*')
            ? route('psychologist.login')
            : route('admin.login'));
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(ApiErrorRenderer::render(...));
    })->create();
