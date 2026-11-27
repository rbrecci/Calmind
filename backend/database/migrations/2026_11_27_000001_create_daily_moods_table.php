<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_moods', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('bond_id');
            $table->unsignedInteger('patient_id');
            $table->enum('mood', ['bad', 'neutral', 'good']);
            $table->date('mood_date');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent();

            // Um humor por dia dentro do vinculo: marcar de novo no mesmo dia troca o valor
            $table->unique(['bond_id', 'mood_date'], 'uq_moods_bond_date');
            $table->index(['patient_id', 'mood_date'], 'ix_moods_patient_date');
            $table->foreign('bond_id', 'fk_moods_bond')->references('id')->on('bonds')->cascadeOnDelete();
            $table->foreign('patient_id', 'fk_moods_patient')->references('id')->on('patients');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_moods');
    }
};
