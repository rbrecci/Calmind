<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consent_acceptances', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('consent_term_id');
            $table->dateTime('accepted_at')->useCurrent();
            $table->dateTime('revoked_at')->nullable(); // CA-04.3: revogacao sem efeito retroativo

            $table->unique(['user_id', 'consent_term_id'], 'uq_acceptance');
            $table->index(['user_id', 'revoked_at'], 'ix_acceptance_user');
            $table->foreign('user_id', 'fk_acc_user')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('consent_term_id', 'fk_acc_term')->references('id')->on('consent_terms');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consent_acceptances');
    }
};
