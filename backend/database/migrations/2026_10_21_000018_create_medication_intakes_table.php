<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medication_intakes', function (Blueprint $table) {
            // CA-28.4: ausencia de linha significa nao marcado. O sistema nunca presume a tomada.
            $table->increments('id');
            $table->unsignedInteger('medication_id');
            $table->dateTime('scheduled_for');
            $table->dateTime('marked_at')->useCurrent();

            $table->unique(['medication_id', 'scheduled_for'], 'uq_intake');
            $table->foreign('medication_id', 'fk_intake_med')->references('id')->on('medications')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medication_intakes');
    }
};
