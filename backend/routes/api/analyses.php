<?php

use App\Http\Controllers\Api\V1\PsychologistAnalysisController;
use Illuminate\Support\Facades\Route;

// RF-41 e RF-42. Nao ha rota de paciente: a sugestao de IA nunca aparece para ele (CA-42.3).
Route::middleware(['auth:sanctum', 'role:psychologist'])->prefix('psychologist/analyses')->group(function (): void {
    Route::get('/', [PsychologistAnalysisController::class, 'index']);
    Route::post('/', [PsychologistAnalysisController::class, 'store']);
    Route::get('{id}', [PsychologistAnalysisController::class, 'show'])->whereNumber('id');
    Route::put('{id}', [PsychologistAnalysisController::class, 'update'])->whereNumber('id');
    Route::post('{id}/confirm', [PsychologistAnalysisController::class, 'confirm'])->whereNumber('id');
    Route::post('{id}/discard', [PsychologistAnalysisController::class, 'discard'])->whereNumber('id');
});
