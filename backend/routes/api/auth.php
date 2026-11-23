<?php

use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

// Bloco A: autenticacao (dono: Rafael)

Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);

// Logout fica fora da barreira de conta ativa: a conta suspensa precisa conseguir sair
Route::middleware('auth:sanctum')->post('auth/logout', [AuthController::class, 'logout']);
Route::middleware(['auth:sanctum', 'active'])->get('me', [AuthController::class, 'me']);
