<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analysis_versions', function (Blueprint $table) {
            // CA-42.4: cada edicao posterior preserva a versao anterior
            $table->increments('id');
            $table->unsignedInteger('analysis_id');
            $table->mediumText('body');
            $table->unsignedInteger('edited_by_user_id');
            $table->dateTime('edited_at')->useCurrent();

            $table->index(['analysis_id', 'edited_at'], 'ix_av_analysis');
            $table->foreign('analysis_id', 'fk_av_analysis')->references('id')->on('analyses')->cascadeOnDelete();
            $table->foreign('edited_by_user_id', 'fk_av_editor')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analysis_versions');
    }
};
