<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            // CA-16.1: a notificacao carrega o tipo do evento, nunca conteudo clinico
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->string('type', 60);
            $table->unsignedInteger('resource_id')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('read_at')->nullable();

            $table->index(['user_id', 'read_at', 'created_at'], 'ix_notif_user');
            $table->foreign('user_id', 'fk_notif_user')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
