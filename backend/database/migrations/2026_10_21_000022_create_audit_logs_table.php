<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            // CA-17.3: somente insercao. A aplicacao nunca altera nem apaga linha daqui.
            $table->increments('id');
            $table->unsignedInteger('actor_user_id')->nullable();
            $table->string('action', 60);
            $table->string('resource_type', 60);
            $table->unsignedInteger('resource_id')->nullable();
            $table->unsignedInteger('target_patient_id')->nullable();
            $table->enum('result', ['allowed', 'denied']); // CA-05.2 e CA-23.5: tentativa negada tambem entra
            $table->dateTime('occurred_at')->useCurrent();

            $table->index(['actor_user_id', 'occurred_at'], 'ix_audit_actor');
            $table->index(['target_patient_id', 'occurred_at'], 'ix_audit_target');
            $table->foreign('actor_user_id', 'fk_audit_actor')->references('id')->on('users')->nullOnDelete();
            $table->foreign('target_patient_id', 'fk_audit_target')->references('id')->on('patients')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
