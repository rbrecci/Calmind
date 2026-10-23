<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_acceptances', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('bond_id');
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('service_contract_id');
            $table->dateTime('accepted_at')->useCurrent();

            $table->unique(['bond_id', 'user_id', 'service_contract_id'], 'uq_contract_acceptance');
            $table->foreign('bond_id', 'fk_ca_bond')->references('id')->on('bonds')->cascadeOnDelete();
            $table->foreign('user_id', 'fk_ca_user')->references('id')->on('users');
            $table->foreign('service_contract_id', 'fk_ca_contract')->references('id')->on('service_contracts');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_acceptances');
    }
};
