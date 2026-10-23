<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analyses', function (Blueprint $table) {
            // RF-41 e RF-42: a analise so roda quando o psicologo pede, e nada vai ao
            // prontuario sem a confirmacao dele.
            $table->increments('id');
            $table->unsignedInteger('bond_id');
            $table->unsignedInteger('requested_by_user_id'); // RNF-30: sempre humano, nunca rotina
            $table->date('period_start');
            $table->date('period_end');
            $table->enum('status', ['generated', 'confirmed', 'discarded'])->default('generated');
            $table->mediumText('summary_raw')->nullable(); // CA-42.2: apagado no descarte
            $table->dateTime('requested_at')->useCurrent();
            $table->dateTime('confirmed_at')->nullable();

            $table->index(['bond_id', 'requested_at'], 'ix_analyses_bond');
            $table->foreign('bond_id', 'fk_analyses_bond')->references('id')->on('bonds')->cascadeOnDelete();
            $table->foreign('requested_by_user_id', 'fk_analyses_requester')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analyses');
    }
};
