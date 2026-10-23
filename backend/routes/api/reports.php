<?php

use App\Http\Controllers\Api\V1\PatientReportController;
use App\Http\Controllers\Api\V1\PsychologistReportController;
use Illuminate\Support\Facades\Route;

// Bloco E: relatos (dono: Rafael)

Route::middleware(['auth:sanctum', 'role:patient'])->prefix('patient')->group(function () {
    Route::post('reports', [PatientReportController::class, 'store']);
    Route::get('reports', [PatientReportController::class, 'index']);
    Route::patch('reports/{id}', [PatientReportController::class, 'update'])->whereNumber('id');
    Route::post('reports/{id}/unpublish', [PatientReportController::class, 'unpublish'])->whereNumber('id');
});

// RNF-08: tudo sob /psychologist le a view shared_reports (SharedReportService), nunca a tabela reports
Route::middleware(['auth:sanctum', 'role:psychologist'])->prefix('psychologist')->group(function () {
    Route::get('patients/{id}/reports', [PsychologistReportController::class, 'index'])->whereNumber('id');
    Route::get('reports/{id}', [PsychologistReportController::class, 'show'])->whereNumber('id');
});
