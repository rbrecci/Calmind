<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_contracts', function (Blueprint $table) {
            // RF-48 e RNF-24: contrato de prestacao de servicos, exigido pela Resolucao CFP 9/2024
            $table->increments('id');
            $table->string('version', 20);
            $table->mediumText('body');
            $table->dateTime('effective_from');

            $table->unique('version', 'uq_contract_version');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_contracts');
    }
};
