<?php

use App\Http\Controllers\Api\V1\AppointmentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:psychologist'])->prefix('psychologist/appointments')->group(function (): void {
    Route::get('/', [AppointmentController::class, 'index']);
    Route::post('/', [AppointmentController::class, 'store']);
    Route::put('{id}', [AppointmentController::class, 'update'])->whereNumber('id');
    Route::post('{id}/cancel', [AppointmentController::class, 'cancel'])->whereNumber('id');
});

Route::middleware(['auth:sanctum', 'role:patient'])->get('patient/appointments', [AppointmentController::class, 'index']);
