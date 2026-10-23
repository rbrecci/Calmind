<?php

use App\Http\Controllers\Api\V1\PatientTaskController;
use App\Http\Controllers\Api\V1\PsychologistTaskController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:patient'])->prefix('patient/tasks')->group(function (): void {
    Route::get('/', [PatientTaskController::class, 'index']);
    Route::get('{id}', [PatientTaskController::class, 'show'])->whereNumber('id');
    Route::post('{id}/complete', [PatientTaskController::class, 'complete'])->whereNumber('id');
});

Route::middleware(['auth:sanctum', 'role:psychologist'])->prefix('psychologist/tasks')->group(function (): void {
    Route::get('/', [PsychologistTaskController::class, 'index']);
    Route::post('/', [PsychologistTaskController::class, 'store']);
    Route::get('{id}', [PsychologistTaskController::class, 'show'])->whereNumber('id');
    Route::put('{id}', [PsychologistTaskController::class, 'update'])->whereNumber('id');
    Route::delete('{id}', [PsychologistTaskController::class, 'destroy'])->whereNumber('id');
});
