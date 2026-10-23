<?php

namespace Database\Seeders;

use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Seeder;

class BondSeeder extends Seeder
{
    // Paciente com vinculo ativo, dono dos relatos. Os 2 privados sao a massa da prova do RNF-08
    public function run(): void
    {
        $patientUser = User::where('email', UserSeeder::BONDED_PATIENT_EMAIL)->firstOrFail();
        $psychologistUser = User::where('email', UserSeeder::PSYCHOLOGIST_EMAIL)->firstOrFail();
        $patient = $patientUser->patient;

        $bond = Bond::create([
            'patient_id' => $patient->id,
            'psychologist_id' => $psychologistUser->psychologist->id,
            'status' => 'active',
            'origin' => 'catalog',
            'responded_at' => now(),
        ]);

        // RNF-12: o aceite existe antes de qualquer relato
        ConsentAcceptance::create([
            'user_id' => $patientUser->id,
            'consent_term_id' => ConsentTerm::where('type', 'general')->where('version', '1.0')->firstOrFail()->id,
        ]);

        $reports = [
            ['shared', 'Esta semana consegui dormir melhor. Ainda acordo cansada, mas foram três noites seguidas sem acordar de madrugada.'],
            ['shared', 'Fiquei ansiosa antes da reunião de segunda. Fiz a respiração que combinamos e ajudou a diminuir o aperto no peito.'],
            ['shared', 'Conversei com minha irmã sobre o que anda pesando. Foi mais leve do que eu imaginava.'],
            ['private', 'Relato só meu: tive um dia ruim e não quero falar sobre isso agora.'],
            ['private', 'Relato só meu: escrevi uma carta que talvez nunca envie.'],
        ];

        foreach ($reports as $i => [$visibility, $body]) {
            $report = new Report([
                'bond_id' => $bond->id,
                'patient_id' => $patient->id,
                'body' => $body,
                'visibility' => $visibility,
            ]);
            $report->created_at = now()->subDays(count($reports) - $i);
            $report->save();
        }
    }
}
