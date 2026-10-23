<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('bond_id');
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->date('due_date'); // CA-37.3: prazo nao pode ser no passado
            $table->unsignedInteger('created_by_user_id');
            $table->dateTime('completed_at')->nullable(); // CA-25.3: nao duplica conclusao
            $table->dateTime('archived_at')->nullable(); // CA-37.4: arquiva em vez de excluir
            $table->dateTime('created_at')->useCurrent();

            $table->index(['bond_id', 'completed_at', 'due_date'], 'ix_tasks_bond');
            $table->foreign('bond_id', 'fk_tasks_bond')->references('id')->on('bonds')->cascadeOnDelete();
            $table->foreign('created_by_user_id', 'fk_tasks_creator')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
