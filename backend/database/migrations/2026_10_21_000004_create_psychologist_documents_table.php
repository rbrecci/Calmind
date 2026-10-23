<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('psychologist_documents', function (Blueprint $table) {
            // RNF-11: acessivel so ao administrador e ao proprio dono, nunca no catalogo
            $table->increments('id');
            $table->unsignedInteger('psychologist_id');
            $table->string('file_path', 255);
            $table->string('original_name', 255);
            $table->string('mime_type', 100);
            $table->dateTime('uploaded_at')->useCurrent();

            $table->index('psychologist_id', 'ix_docs_psy');
            $table->foreign('psychologist_id', 'fk_docs_psy')->references('id')->on('psychologists')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('psychologist_documents');
    }
};
