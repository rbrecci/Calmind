<?php

use App\Http\Controllers\Api\V1\AdminRegistrationController;
use App\Http\Controllers\Api\V1\PsychologistRegistrationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:psychologist'])->prefix('psychologist')->group(function () {
    Route::post('registration', [PsychologistRegistrationController::class, 'store']);
    Route::put('profile', [PsychologistRegistrationController::class, 'update']);
    Route::post('profile/publish', [PsychologistRegistrationController::class, 'publish']);
    Route::get('documents/{id}', [PsychologistRegistrationController::class, 'document'])->whereNumber('id');
});

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('registrations', [AdminRegistrationController::class, 'index']);
    Route::post('registrations/{id}/approve', [AdminRegistrationController::class, 'approve'])->whereNumber('id');
    Route::post('registrations/{id}/reject', [AdminRegistrationController::class, 'reject'])->whereNumber('id');
    Route::get('documents/{id}', [AdminRegistrationController::class, 'document'])->whereNumber('id');
});
