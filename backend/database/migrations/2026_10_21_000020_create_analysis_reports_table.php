<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analysis_reports', function (Blueprint $table) {
            $table->unsignedInteger('analysis_id');
            $table->unsignedInteger('report_id');

            $table->primary(['analysis_id', 'report_id']);
            $table->index('report_id', 'ix_ar_report'); // CA-24.2: daqui sai o aviso de que o relato ja foi usado em uma analise
            $table->foreign('analysis_id', 'fk_ar_analysis')->references('id')->on('analyses')->cascadeOnDelete();
            $table->foreign('report_id', 'fk_ar_report')->references('id')->on('reports')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analysis_reports');
    }
};
