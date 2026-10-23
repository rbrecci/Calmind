<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bonds', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('patient_id');
            $table->unsignedInteger('psychologist_id');
            $table->enum('status', ['pending', 'active', 'ended'])->default('pending');
            $table->enum('origin', ['invitation', 'catalog']);
            $table->unsignedInteger('invitation_id')->nullable();
            $table->dateTime('requested_at')->useCurrent();
            $table->dateTime('responded_at')->nullable();
            $table->dateTime('ended_at')->nullable();
            $table->unsignedInteger('ended_by_user_id')->nullable();
            // RF-12 e DEC-03: no maximo 1 vinculo ativo por paciente, N por psicologo.
            // A coluna gerada vale o id do paciente so quando o vinculo esta ativo; fora disso
            // vale NULL, e NULL nao colide em indice unico. Assim a regra vive no banco e
            // sobrevive a duas requisicoes simultaneas.
            $table->unsignedInteger('active_patient_id')->nullable()->storedAs("IF(status = 'active', patient_id, NULL)");

            $table->unique('active_patient_id', 'uq_one_active_bond_per_patient');
            $table->index(['psychologist_id', 'status'], 'ix_bond_psy');
            $table->index(['patient_id', 'status'], 'ix_bond_patient');
            $table->foreign('patient_id', 'fk_bond_patient')->references('id')->on('patients');
            $table->foreign('psychologist_id', 'fk_bond_psy')->references('id')->on('psychologists');
            $table->foreign('invitation_id', 'fk_bond_inv')->references('id')->on('invitations')->nullOnDelete();
            $table->foreign('ended_by_user_id', 'fk_bond_ender')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bonds');
    }
};
