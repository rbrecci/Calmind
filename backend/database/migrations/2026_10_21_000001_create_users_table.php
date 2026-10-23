<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 150);
            $table->string('email', 190);
            $table->string('password_hash', 255); // RNF-07: irreversivel, nunca exibido
            $table->enum('role', ['patient', 'psychologist', 'admin']);
            $table->enum('status', ['active', 'suspended'])->default('active'); // RF-45
            $table->dateTime('suspended_at')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique('email', 'uq_users_email');
            $table->index('role', 'ix_users_role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
