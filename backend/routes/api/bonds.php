<?php

use App\Http\Controllers\Api\V1\BondController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\InvitationController;
use Illuminate\Support\Facades\Route;

// Bloco D: convite e vinculo (dono: Rafael)

Route::middleware(['auth:sanctum', 'role:psychologist'])->prefix('psychologist')->group(function () {
    Route::post('invitations', [InvitationController::class, 'store']);
    Route::delete('invitations/{id}', [InvitationController::class, 'destroy'])->whereNumber('id');
    Route::post('bond-requests/{id}/accept', [BondController::class, 'accept'])->whereNumber('id');
    Route::post('bond-requests/{id}/reject', [BondController::class, 'reject'])->whereNumber('id');
});

Route::middleware(['auth:sanctum', 'role:patient'])->group(function () {
    Route::post('patient/bonds/redeem-invitation', [InvitationController::class, 'redeem']);
    Route::post('patient/bonds/requests', [BondController::class, 'request']);
    Route::get('catalog/psychologists', [CatalogController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'role:patient,psychologist'])->group(function () {
    Route::post('bonds/{id}/end', [BondController::class, 'end'])->whereNumber('id');
});
