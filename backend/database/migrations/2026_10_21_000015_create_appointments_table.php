<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('bond_id');
            $table->dateTime('scheduled_at');
            $table->enum('status', ['scheduled', 'rescheduled', 'cancelled', 'done'])->default('scheduled');
            $table->enum('modality', ['online', 'presencial'])->nullable();
            $table->string('notes', 255)->nullable();
            $table->unsignedInteger('created_by_user_id');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index(['bond_id', 'scheduled_at'], 'ix_appt_bond');
            $table->index(['created_by_user_id', 'scheduled_at'], 'ix_appt_conflict'); // CA-40.3: deteccao de conflito
            $table->foreign('bond_id', 'fk_appt_bond')->references('id')->on('bonds')->cascadeOnDelete();
            $table->foreign('created_by_user_id', 'fk_appt_creator')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
