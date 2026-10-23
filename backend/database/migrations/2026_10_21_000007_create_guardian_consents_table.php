<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guardian_consents', function (Blueprint $table) {
            // RF-49: o responsavel nao tem conta (DEC-17); o psicologo registra o consentimento
            // obtido fora da plataforma. Append-only: CA-49.3 proibe editar registro existente.
            $table->increments('id');
            $table->unsignedInteger('patient_id');
            $table->unsignedInteger('consent_term_id'); // RNF-13: versao vigente na data da obtencao
            $table->unsignedInteger('registered_by_user_id'); // CA-49.1: qual psicologo registrou
            $table->string('guardian_name', 150); // copia no momento do registro, nao referencia
            $table->date('obtained_at'); // CA-49.1: quando o responsavel consentiu
            $table->enum('method', ['presencial', 'telefone', 'videochamada', 'mensagem_escrita']);
            $table->text('note')->nullable();
            $table->dateTime('created_at')->useCurrent();

            $table->index(['patient_id', 'obtained_at'], 'ix_gconsent_patient');
            $table->foreign('patient_id', 'fk_gconsent_patient')->references('id')->on('patients')->cascadeOnDelete();
            $table->foreign('consent_term_id', 'fk_gconsent_term')->references('id')->on('consent_terms');
            $table->foreign('registered_by_user_id', 'fk_gconsent_user')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardian_consents');
    }
};
