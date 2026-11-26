<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Caminho no disco privado `local`: a imagem so sai pela rota autenticada, nunca por URL publica (LGPD)
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_path')->nullable()->after('suspended_at');
            $table->string('cover_path')->nullable()->after('avatar_path');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar_path', 'cover_path']);
        });
    }
};
