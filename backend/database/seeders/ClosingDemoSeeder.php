<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Bond;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;

class ClosingDemoSeeder extends Seeder
{
    public function run(): void
    {
        $psychologist = User::where('email', UserSeeder::PSYCHOLOGIST_EMAIL)->firstOrFail();
        $patient = User::where('email', UserSeeder::BONDED_PATIENT_EMAIL)->firstOrFail();
        $bond = Bond::where('patient_id', $patient->patient->id)
            ->where('psychologist_id', $psychologist->psychologist->id)
            ->where('status', 'active')->firstOrFail();

        // Mantem os dois pacientes sem vinculo disponiveis para testar convite e catalogo.
        $requester = User::create([
            'name' => 'Samwise Gamgee',
            'email' => 'samwise.gamgee@example.com',
            'password_hash' => UserSeeder::PASSWORD,
            'role' => 'patient',
            'status' => 'active',
        ]);
        $requesterPatient = Patient::create([
            'user_id' => $requester->id,
            'birth_date' => '2000-04-06',
        ]);
        $request = Bond::create([
            'patient_id' => $requesterPatient->id,
            'psychologist_id' => $psychologist->psychologist->id,
            'status' => 'pending',
            'origin' => 'catalog',
            'requested_at' => now()->subHour(),
        ]);

        $message = Message::create([
            'bond_id' => $bond->id,
            'sender_user_id' => $psychologist->id,
            'body' => 'Olá, Elizabeth. Nosso próximo encontro já está na agenda.',
        ]);
        Message::create([
            'bond_id' => $bond->id,
            'sender_user_id' => $patient->id,
            'body' => 'Obrigada, Hermione. Vou conferir os horários.',
        ]);

        foreach ([
            [now()->addDays(2)->setTime(15, 0), 'scheduled', 'online'],
            [now()->addDays(9)->setTime(15, 0), 'scheduled', 'presencial'],
            [now()->subDays(5)->setTime(15, 0), 'done', 'online'],
        ] as [$scheduledAt, $status, $modality]) {
            Appointment::create([
                'bond_id' => $bond->id,
                'scheduled_at' => $scheduledAt,
                'status' => $status,
                'modality' => $modality,
                'notes' => 'Consulta fictícia para demonstração.',
                'created_by_user_id' => $psychologist->id,
            ]);
        }

        Notification::create([
            'user_id' => $patient->id,
            'type' => 'message.received',
            'resource_id' => $message->id,
        ]);
        Notification::create([
            'user_id' => $psychologist->id,
            'type' => 'bond.requested',
            'resource_id' => $request->id,
        ]);
    }
}
