<?php

use App\Http\Controllers\Api\V1\ConsentController;
use App\Http\Controllers\Api\V1\GuardianConsentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('consent-terms/current', [ConsentController::class, 'current']);
    Route::post('consent-acceptances', [ConsentController::class, 'store']);
    Route::post('consent-acceptances/{id}/revoke', [ConsentController::class, 'revoke'])->whereNumber('id');
});

Route::middleware(['auth:sanctum', 'role:psychologist'])->group(function () {
    Route::get('psychologist/patients/{id}/guardian-consent', [GuardianConsentController::class, 'index'])->whereNumber('id');
    Route::post('psychologist/patients/{id}/guardian-consent', [GuardianConsentController::class, 'store'])->whereNumber('id');
});
