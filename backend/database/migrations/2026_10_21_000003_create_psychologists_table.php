<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('psychologists', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->string('crp_number', 20);
            $table->string('crp_region', 5);
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('approval_note')->nullable(); // CA-44.3: justificativa obrigatoria na reprovacao
            $table->unsignedInteger('approved_by_user_id')->nullable();
            $table->dateTime('approval_decided_at')->nullable();
            $table->string('profile_approach', 120)->nullable(); // RF-09: filtro de abordagem
            $table->string('profile_specialty', 120)->nullable();
            $table->enum('profile_modality', ['online', 'presencial', 'ambos'])->nullable();
            $table->string('profile_region', 120)->nullable();
            $table->text('profile_bio')->nullable(); // RF-34: escrito pelo profissional, nunca gerado
            $table->dateTime('profile_published_at')->nullable(); // CA-34.2: sem isso nao aparece no catalogo
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique('user_id', 'uq_psychologists_user');
            $table->unique(['crp_region', 'crp_number'], 'uq_psychologists_crp');
            $table->index(['approval_status', 'profile_published_at'], 'ix_psy_catalog');
            $table->foreign('user_id', 'fk_psy_user')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('approved_by_user_id', 'fk_psy_approver')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('psychologists');
    }
};
