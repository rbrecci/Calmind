<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->unsignedInteger('user_id');
            $table->string('type', 60);
            $table->boolean('enabled')->default(true); // CA-16.2

            $table->primary(['user_id', 'type']);
            $table->foreign('user_id', 'fk_notifpref_user')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
