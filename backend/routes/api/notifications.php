<?php

use App\Http\Controllers\Api\V1\NotificationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'role:patient,psychologist'])->prefix('notifications')->group(function (): void {
    Route::get('/', [NotificationController::class, 'index']);
    Route::post('read-all', [NotificationController::class, 'readAll']);
    Route::post('{id}/read', [NotificationController::class, 'read'])->whereNumber('id');
});
