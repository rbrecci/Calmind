<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medication_schedules', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('medication_id');
            $table->unsignedTinyInteger('weekday'); // 0 domingo a 6 sabado
            $table->time('time_of_day');

            $table->unique(['medication_id', 'weekday', 'time_of_day'], 'uq_med_schedule');
            $table->foreign('medication_id', 'fk_sched_med')->references('id')->on('medications')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medication_schedules');
    }
};
