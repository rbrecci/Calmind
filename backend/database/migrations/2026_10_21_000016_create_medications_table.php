<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medications', function (Blueprint $table) {
            // DEC-10: a plataforma NAO prescreve. O psicologo registra medicacao ja prescrita
            // por medico, com origem obrigatoria, e o paciente confirma.
            $table->increments('id');
            $table->unsignedInteger('bond_id');
            $table->string('name', 150);
            $table->string('dosage', 100)->nullable();
            $table->string('prescription_source', 200); // CA-38.2: obrigatorio, quem prescreveu
            $table->enum('status', ['awaiting_confirmation', 'active', 'refused', 'suspended'])
                ->default('awaiting_confirmation');
            $table->unsignedInteger('registered_by_user_id');
            $table->dateTime('confirmed_at')->nullable();
            $table->dateTime('refused_at')->nullable();
            $table->text('refusal_reason')->nullable(); // CA-27.4: motivo obrigatorio na recusa
            $table->dateTime('suspended_at')->nullable();
            $table->unsignedInteger('suspended_by_user_id')->nullable(); // CA-29.2: visivel ao psicologo de quem partiu
            $table->dateTime('created_at')->useCurrent();

            $table->index(['bond_id', 'status'], 'ix_med_bond');
            $table->foreign('bond_id', 'fk_med_bond')->references('id')->on('bonds')->cascadeOnDelete();
            $table->foreign('registered_by_user_id', 'fk_med_registrar')->references('id')->on('users');
            $table->foreign('suspended_by_user_id', 'fk_med_suspender')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medications');
    }
};
