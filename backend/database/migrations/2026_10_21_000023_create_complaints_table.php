<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('reporter_user_id');
            $table->unsignedInteger('reported_user_id');
            $table->string('reason', 120); // CA-18.2: motivo obrigatorio
            $table->text('description')->nullable();
            $table->enum('status', ['open', 'closed', 'reopened'])->default('open');
            $table->text('decision')->nullable();
            $table->unsignedInteger('decided_by_user_id')->nullable();
            $table->dateTime('decided_at')->nullable();
            $table->dateTime('created_at')->useCurrent();

            $table->index(['status', 'created_at'], 'ix_complaints_status');
            $table->foreign('reporter_user_id', 'fk_comp_reporter')->references('id')->on('users');
            $table->foreign('reported_user_id', 'fk_comp_reported')->references('id')->on('users');
            $table->foreign('decided_by_user_id', 'fk_comp_decider')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
