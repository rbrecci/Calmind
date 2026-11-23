<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // nao e unico: appointment.rescheduled se repete para a mesma consulta
            $table->index(['user_id', 'type', 'resource_id'], 'ix_notif_reminder');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('ix_notif_reminder');
        });
    }
};
