<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('bond_id');
            $table->unsignedInteger('sender_user_id');
            $table->text('body');
            $table->dateTime('sent_at')->useCurrent();
            $table->dateTime('read_at')->nullable();

            $table->index(['bond_id', 'sent_at'], 'ix_messages_bond');
            $table->index(['bond_id', 'read_at'], 'ix_messages_unread');
            $table->foreign('bond_id', 'fk_msg_bond')->references('id')->on('bonds')->cascadeOnDelete();
            $table->foreign('sender_user_id', 'fk_msg_sender')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
