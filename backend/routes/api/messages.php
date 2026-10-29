<?php

use App\Http\Controllers\Api\V1\MessageController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('bonds/{id}/messages')->whereNumber('id')->group(function (): void {
    Route::get('/', [MessageController::class, 'index']);
    Route::post('/', [MessageController::class, 'store']);
    Route::post('read', [MessageController::class, 'read']);
});
