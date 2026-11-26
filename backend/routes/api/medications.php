<?php

use App\Http\Controllers\Api\V1\PatientMedicationController;
use App\Http\Controllers\Api\V1\PsychologistMedicationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:patient'])->prefix('patient/medications')->group(function (): void {
    Route::get('/', [PatientMedicationController::class, 'index']);
    Route::get('doses', [PatientMedicationController::class, 'doses']);
    Route::get('{id}', [PatientMedicationController::class, 'show'])->whereNumber('id');
    Route::post('{id}/confirm', [PatientMedicationController::class, 'confirm'])->whereNumber('id');
    Route::post('{id}/refuse', [PatientMedicationController::class, 'refuse'])->whereNumber('id');
    Route::post('{id}/suspend', [PatientMedicationController::class, 'suspend'])->whereNumber('id');
    Route::post('{id}/intakes', [PatientMedicationController::class, 'markTaken'])->whereNumber('id');
});

Route::middleware(['auth:sanctum', 'role:psychologist'])->prefix('psychologist/medications')->group(function (): void {
    Route::get('/', [PsychologistMedicationController::class, 'index']);
    Route::post('/', [PsychologistMedicationController::class, 'store']);
    Route::get('{id}', [PsychologistMedicationController::class, 'show'])->whereNumber('id');
    Route::post('{id}/reactivate', [PsychologistMedicationController::class, 'reactivate'])->whereNumber('id');
});
