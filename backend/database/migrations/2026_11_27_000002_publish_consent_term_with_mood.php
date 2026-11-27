<?php

use Database\Seeders\ConsentTermSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Humor e dado de saude novo, entao o termo precisa cita-lo. Versao publicada nao se edita
// (CA-46.2): quem ja tem a 1.0 sem o humor ganha a 1.1, e cada pessoa aceita de novo ao abrir o app.
// Banco vazio nao faz nada: o seeder ja publica a 1.0 com o texto atual.
return new class extends Migration
{
    public function up(): void
    {
        $current = DB::table('consent_terms')->where('type', 'general')->orderByDesc('effective_from')->orderByDesc('id')->first();
        if (! $current || str_contains($current->body, 'humor')) {
            return;
        }

        DB::table('consent_terms')->insert([
            'type' => 'general',
            'version' => '1.1',
            'body' => ConsentTermSeeder::generalBody(),
            'effective_from' => now(),
            'published_by_user_id' => $current->published_by_user_id,
        ]);
    }

    // Sem volta: apagar um termo publicado apagaria a prova dos aceites feitos sobre ele
    public function down(): void {}
};
