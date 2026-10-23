<?php

use App\Http\Controllers\Web\AdminRegistrationController;
use App\Http\Controllers\Web\AdminSessionController;
use App\Http\Controllers\Web\PsychologistSessionController;
use App\Http\Controllers\Web\PsychologistTaskController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('admin')->name('admin.')->group(function (): void {
    Route::get('login', [AdminSessionController::class, 'create'])->name('login');
    Route::post('login', [AdminSessionController::class, 'store'])->name('login.store');

    Route::middleware(['auth', 'role:admin'])->group(function (): void {
        Route::post('logout', [AdminSessionController::class, 'destroy'])->name('logout');
        Route::get('registrations', [AdminRegistrationController::class, 'index'])->name('registrations.index');
        Route::post('registrations/{id}/approve', [AdminRegistrationController::class, 'approve'])->name('registrations.approve');
        Route::post('registrations/{id}/reject', [AdminRegistrationController::class, 'reject'])->name('registrations.reject');
        Route::get('documents/{id}', [AdminRegistrationController::class, 'document'])->whereNumber('id')->name('documents.show');
    });
});

Route::prefix('psychologist')->name('psychologist.')->group(function (): void {
    Route::get('login', [PsychologistSessionController::class, 'create'])->name('login');
    Route::post('login', [PsychologistSessionController::class, 'store'])->name('login.submit');

    Route::middleware(['auth', 'role:psychologist'])->group(function (): void {
        Route::post('logout', [PsychologistSessionController::class, 'destroy'])->name('logout');
        Route::get('tasks', [PsychologistTaskController::class, 'index'])->name('tasks.index');
        Route::post('tasks', [PsychologistTaskController::class, 'store'])->name('tasks.store');
    });
});
