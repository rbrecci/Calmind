<?php

use App\Http\Controllers\Api\V1\ConsentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('consent-terms/current', [ConsentController::class, 'current']);
    Route::post('consent-acceptances', [ConsentController::class, 'store']);
    Route::post('consent-acceptances/{id}/revoke', [ConsentController::class, 'revoke'])->whereNumber('id');
});
