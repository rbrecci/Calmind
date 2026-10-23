<?php

namespace Database\Seeders;

use App\Models\ConsentTerm;
use App\Models\User;
use Illuminate\Database\Seeder;

class ConsentTermSeeder extends Seeder
{
    // RNF-13: termos versionados. O consentimento de IA e separado do geral (RF-04)
    public function run(): void
    {
        $admin = User::where('email', UserSeeder::ADMIN_EMAIL)->firstOrFail();

        ConsentTerm::create([
            'type' => 'general',
            'version' => '1.0',
            'body' => 'Termo de consentimento geral, versão de teste. Texto fictício para desenvolvimento.',
            'effective_from' => now()->subMonth(),
            'published_by_user_id' => $admin->id,
        ]);

        ConsentTerm::create([
            'type' => 'ai_analysis',
            'version' => '1.0',
            'body' => 'Termo de consentimento para análise por IA, versão de teste. Texto fictício para desenvolvimento.',
            'effective_from' => now()->subMonth(),
            'published_by_user_id' => $admin->id,
        ]);
    }
}
