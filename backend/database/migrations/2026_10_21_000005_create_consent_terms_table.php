<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consent_terms', function (Blueprint $table) {
            $table->increments('id');
            $table->enum('type', ['general', 'ai_analysis']); // RF-04: consentimento de IA e separado
            $table->string('version', 20);
            $table->mediumText('body');
            $table->dateTime('effective_from');
            $table->unsignedInteger('published_by_user_id')->nullable();
            $table->dateTime('created_at')->useCurrent();

            $table->unique(['type', 'version'], 'uq_terms_type_version'); // CA-46.2: versao publicada nao se edita
            $table->foreign('published_by_user_id', 'fk_terms_publisher')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consent_terms');
    }
};
