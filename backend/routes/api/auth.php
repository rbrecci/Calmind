<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ProfileImageController;
use Illuminate\Support\Facades\Route;

// Bloco A: autenticacao (dono: Rafael)

Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);

// Logout fica fora da barreira de conta ativa: a conta suspensa precisa conseguir sair
Route::middleware('auth:sanctum')->post('auth/logout', [AuthController::class, 'logout']);
Route::middleware(['auth:sanctum', 'active'])->get('me', [AuthController::class, 'me']);

// Foto de perfil e capa: valem para paciente e psicologo. A leitura passa pela UserPolicy
Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('me/{kind}', [ProfileImageController::class, 'update'])->whereIn('kind', ['avatar', 'cover']);
    Route::delete('me/{kind}', [ProfileImageController::class, 'destroy'])->whereIn('kind', ['avatar', 'cover']);
    Route::get('users/{id}/{kind}', [ProfileImageController::class, 'show'])
        ->whereNumber('id')->whereIn('kind', ['avatar', 'cover'])->name('users.profile-image');
});
