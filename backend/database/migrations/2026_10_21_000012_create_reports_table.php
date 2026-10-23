<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('bond_id');
            $table->unsignedInteger('patient_id');
            $table->mediumText('body');
            $table->enum('visibility', ['shared', 'private'])->default('shared'); // DEC-13: padrao compartilhado
            $table->dateTime('unpublished_at')->nullable(); // RF-24: despublicado pelo paciente
            $table->dateTime('created_at')->useCurrent();

            $table->index(['bond_id', 'created_at'], 'ix_reports_bond_period');
            $table->index(['bond_id', 'visibility', 'created_at'], 'ix_reports_visibility');
            $table->foreign('bond_id', 'fk_reports_bond')->references('id')->on('bonds')->cascadeOnDelete();
            $table->foreign('patient_id', 'fk_reports_patient')->references('id')->on('patients');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
