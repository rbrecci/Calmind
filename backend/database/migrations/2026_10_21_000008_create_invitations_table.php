<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('psychologist_id');
            $table->string('code', 12); // RNF-05: aleatorio, alfabeto sem 0/O e 1/I/l
            $table->dateTime('expires_at'); // RNF-05: prazo definido
            $table->dateTime('consumed_at')->nullable(); // CA-07.1: uso unico
            $table->unsignedInteger('consumed_by_patient_id')->nullable();
            $table->dateTime('revoked_at')->nullable(); // RF-08
            $table->dateTime('created_at')->useCurrent();

            $table->unique('code', 'uq_invitation_code');
            $table->index(['psychologist_id', 'consumed_at'], 'ix_invitation_psy');
            $table->foreign('psychologist_id', 'fk_inv_psy')->references('id')->on('psychologists')->cascadeOnDelete();
            $table->foreign('consumed_by_patient_id', 'fk_inv_patient')->references('id')->on('patients')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
