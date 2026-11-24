<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Bond;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\Task;
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

        // Atribuidas depois da consulta concluida. due_date e obrigatorio, entao nao ha tarefa sem prazo;
        // a de prazo hoje gera o lembrete task.due_soon (RF-16) quando a Elizabeth abre as notificacoes
        $assignedAt = now()->subDays(5)->setTime(16, 0);
        foreach ([
            ['Registrar o humor três vezes nesta semana', 'Use os relatos para anotar como você se sentiu em três dias diferentes, com uma frase sobre o que aconteceu.', today(), null],
            ['Praticar a respiração 4-7-8 antes de dormir', 'Inspire contando até 4, segure até 7 e solte o ar contando até 8. Repita quatro vezes, por pelo menos três noites.', today()->addDays(4), null],
            ['Anotar um pensamento automático e uma resposta alternativa', 'Quando perceber um pensamento que pesa, escreva o que pensou, o que sentiu e uma forma mais equilibrada de ver a situação. Traga para a próxima sessão.', today()->addDays(10), null],
            ['Escrever três coisas que deram certo no dia', 'Antes de dormir, liste três coisas pequenas que correram bem.', today()->subDay(), now()->subDays(2)->setTime(21, 30)],
        ] as [$title, $description, $dueDate, $completedAt]) {
            $task = new Task([
                'bond_id' => $bond->id,
                'title' => $title,
                'description' => $description,
                'due_date' => $dueDate,
                'created_by_user_id' => $psychologist->id,
                'completed_at' => $completedAt,
            ]);
            $task->created_at = $assignedAt;
            $task->save();
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
