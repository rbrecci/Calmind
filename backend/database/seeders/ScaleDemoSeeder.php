<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\DailyMood;
use App\Models\Message;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\Report;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

// Massa grande, para ver as telas cheias: muitos pacientes na lista da psicologa, meses de relatos,
// humor, tarefas, conversa, agenda e notificacoes na paciente de demonstracao, e um catalogo extenso.
// Opcional: NAO entra no DatabaseSeeder (os testes e o roteiro contam com a massa pequena).
//   php artisan db:seed --class=ScaleDemoSeeder
// Precisa do seed padrao antes. RNF-63: tudo ficticio. Rodar de novo nao duplica.
class ScaleDemoSeeder extends Seeder
{
    private const MARKER_EMAIL = 'escala.paciente001@example.com';

    private const ACTIVE_PATIENTS = 40;

    private const ENDED_PATIENTS = 12;

    private const PENDING_REQUESTS = 8;

    private const CATALOG_PSYCHOLOGISTS = 30;

    private const HISTORY_DAYS = 180;

    private const FIRST_NAMES = ['Ana', 'Bruno', 'Camila', 'Diego', 'Elisa', 'Felipe', 'Gabriela', 'Heitor', 'Isabela', 'João',
        'Karina', 'Lucas', 'Marina', 'Nicolas', 'Olívia', 'Paulo', 'Rafaela', 'Samuel', 'Tainá', 'Vitor'];

    private const LAST_NAMES = ['Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Ferreira', 'Gomes', 'Hernandes', 'Lima',
        'Moreira', 'Nogueira', 'Oliveira', 'Pires', 'Queiroz', 'Ramos', 'Souza', 'Teixeira'];

    private const REPORTS = [
        'Hoje acordei mais disposto e consegui cumprir o que tinha planejado para a manhã.',
        'Senti o peito apertado antes de sair de casa. Fiz a respiração combinada e passou aos poucos.',
        'Dormi mal, fiquei revirando na cama pensando no trabalho até tarde.',
        'Consegui dizer não para um pedido sem me culpar tanto. Foi estranho e bom.',
        'Dia comum. Nada de muito bom nem de muito ruim, só segui a rotina.',
        'Briguei com alguém da família e passei a tarde remoendo a conversa.',
        'Caminhei no fim do dia, como combinamos, e a cabeça ficou mais leve.',
        'Fiquei adiando uma tarefa importante o dia inteiro e isso me deixou irritado comigo.',
        'Encontrei uma amiga e conversamos por horas. Fazia tempo que eu não ria assim.',
        'A apresentação foi melhor do que eu esperava, mesmo com as mãos tremendo no começo. Depois que comecei a falar, percebi que as pessoas estavam atentas e que eu sabia o assunto. Quero lembrar disso na próxima vez em que o medo chegar antes da hora.',
    ];

    private const TASKS = [
        'Registrar um momento bom do dia', 'Praticar a respiração 4-7-8', 'Caminhar por vinte minutos',
        'Anotar um pensamento automático', 'Dormir sem o celular na cama', 'Conversar com alguém de confiança',
        'Separar dez minutos de pausa', 'Escrever três coisas que deram certo',
    ];

    private const MESSAGES = [
        'Bom dia! Como foi a semana até agora?', 'Foi corrida, mas consegui fazer os exercícios.',
        'Que bom. Anote o que mudou quando você fez.', 'Posso remarcar a próxima conversa?',
        'Pode sim, veja os horários na agenda.', 'Obrigada pela atenção.',
    ];

    private string $password;

    private int $generalTermId;

    public function run(): void
    {
        if (User::where('email', self::MARKER_EMAIL)->exists()) {
            $this->command?->info('Massa de escala já existe.');

            return;
        }

        $psychologist = User::where('email', UserSeeder::PSYCHOLOGIST_EMAIL)->firstOrFail();
        $patient = User::where('email', UserSeeder::BONDED_PATIENT_EMAIL)->firstOrFail();
        $bond = Bond::where('patient_id', $patient->patient->id)
            ->where('psychologist_id', $psychologist->psychologist->id)
            ->where('status', 'active')->firstOrFail();

        // Um hash para todos: calcular um por conta deixaria o seed lento sem ganho nenhum
        $this->password = Hash::make(UserSeeder::PASSWORD);
        $this->generalTermId = ConsentTerm::where('type', 'general')->where('effective_from', '<=', now())
            ->orderByDesc('effective_from')->orderByDesc('id')->firstOrFail()->id;

        // Sorteio fixo: duas execucoes em bancos novos geram a mesma massa
        mt_srand(2026);

        DB::transaction(function () use ($psychologist, $patient, $bond) {
            // Aceite da psicologa: sem ele o app abre no termo e nao mostra a lista
            ConsentAcceptance::firstOrCreate(['user_id' => $psychologist->id, 'consent_term_id' => $this->generalTermId]);

            $this->mainPatient($bond, $psychologist, $patient);
            $this->otherPatients($psychologist);
            $this->catalog();
        });
    }

    // Seis meses de uso da paciente de demonstracao
    private function mainPatient(Bond $bond, User $psychologist, User $patient): void
    {
        $since = now()->subDays(self::HISTORY_DAYS);
        $bond->forceFill(['requested_at' => $since, 'responded_at' => $since, 'accepted_at' => $since])->save();

        for ($daysAgo = self::HISTORY_DAYS - 1; $daysAgo >= 1; $daysAgo--) {
            $day = today()->subDays($daysAgo);
            if (mt_rand(1, 10) <= 8) {
                $this->mood($bond, $day);
            }
            // De zero a tres relatos por dia, para o calendario ter dias vazios e dias cheios
            $count = mt_rand(0, 3);
            for ($n = 1; $n <= $count; $n++) {
                $this->report($bond, $day->copy()->setTime(7 + $n * 4, mt_rand(0, 59)));
            }
        }

        for ($i = 0; $i < 40; $i++) {
            $this->task($bond, $psychologist, $i, today()->subDays(60)->addDays($i * 2), $i < 32);
        }
        for ($i = 0; $i < 300; $i++) {
            $fromPsychologist = $i % 2 === 0;
            $this->message($bond, $fromPsychologist ? $psychologist : $patient, self::MESSAGES[$i % count(self::MESSAGES)], now()->subHours((300 - $i) * 8), $i < 296);
        }
        for ($i = 0; $i < 30; $i++) {
            $this->appointment($bond, $psychologist, today()->subWeeks(26 - $i)->setTime(15, 0));
        }
        for ($i = 0; $i < 60; $i++) {
            $this->notification($patient, ['message.received', 'task.assigned', 'appointment.upcoming'][$i % 3], $bond->id, now()->subHours($i * 20 + 1), $i > 4);
        }
    }

    private function otherPatients(User $psychologist): void
    {
        $total = self::ACTIVE_PATIENTS + self::ENDED_PATIENTS + self::PENDING_REQUESTS;

        for ($i = 1; $i <= $total; $i++) {
            $user = $this->user($this->name($i), sprintf('escala.paciente%03d@example.com', $i), 'patient');
            $patient = Patient::create([
                'user_id' => $user->id,
                'birth_date' => now()->subYears(19 + $i % 30)->subDays($i)->toDateString(),
            ]);
            ConsentAcceptance::create(['user_id' => $user->id, 'consent_term_id' => $this->generalTermId]);

            $status = $i <= self::ACTIVE_PATIENTS ? 'active' : ($i <= self::ACTIVE_PATIENTS + self::ENDED_PATIENTS ? 'ended' : 'pending');
            $since = now()->subDays($status === 'pending' ? $i % 5 : 10 + $i * 3);

            $bond = Bond::create([
                'patient_id' => $patient->id,
                'psychologist_id' => $psychologist->psychologist->id,
                'status' => $status,
                'origin' => 'catalog',
                'requested_at' => $since,
                'responded_at' => $status === 'pending' ? null : $since,
                'accepted_at' => $status === 'pending' ? null : $since,
                'ended_at' => $status === 'ended' ? now()->subDays($i % 9) : null,
                'ended_by_user_id' => $status === 'ended' ? $psychologist->id : null,
            ]);

            if ($status === 'pending') {
                $this->notification($psychologist, 'bond.requested', $bond->id, $since, false);

                continue;
            }

            foreach (range(1, 12) as $daysAgo) {
                $this->mood($bond, today()->subDays($daysAgo));
                if ($daysAgo % 3 === 0) {
                    $this->report($bond, today()->subDays($daysAgo)->setTime(20, $i % 60));
                }
            }
            foreach (range(0, 2) as $n) {
                // Cada quinto paciente fica com uma tarefa vencida, para o aviso aparecer na lista
                $this->task($bond, $psychologist, $i + $n, today()->addDays($n * 3 - ($i % 5 === 0 ? 4 : 0)), false);
            }
            if ($status === 'active') {
                $this->appointment($bond, $psychologist, today()->addDays(1 + $i % 20)->setTime(8 + $i % 10, 0));
                $this->message($bond, $user, self::MESSAGES[1], now()->subHours($i), $i % 4 !== 0);
            }
        }
    }

    private function catalog(): void
    {
        $approaches = ['Terapia cognitivo-comportamental', 'Psicanálise', 'Gestalt-terapia', 'Abordagem centrada na pessoa', 'Análise do comportamento'];
        $specialties = ['Ansiedade e estresse', 'Luto', 'Relacionamentos', 'Orientação profissional', 'Adolescência'];
        $regions = ['São Paulo, SP', 'Campinas, SP', 'Santos, SP', 'Sorocaba, SP', 'Curitiba, PR'];
        $adminId = User::where('email', UserSeeder::ADMIN_EMAIL)->value('id');

        for ($i = 1; $i <= self::CATALOG_PSYCHOLOGISTS; $i++) {
            $user = $this->user($this->name($i + 100), sprintf('escala.psicologo%02d@example.com', $i), 'psychologist');
            Psychologist::create([
                'user_id' => $user->id,
                'crp_number' => sprintf('9%05d', $i),
                'crp_region' => '06',
                'approval_status' => 'approved',
                'approved_by_user_id' => $adminId,
                'approval_decided_at' => now(),
                'profile_published_at' => now(),
                'profile_approach' => $approaches[$i % count($approaches)],
                'profile_specialty' => $specialties[$i % count($specialties)],
                'profile_modality' => ['online', 'presencial', 'ambos'][$i % 3],
                'profile_region' => $regions[$i % count($regions)],
                'profile_bio' => 'Perfil fictício de demonstração. Atendo adultos com encontros semanais e combinados claros.',
            ]);
        }
    }

    private function name(int $i): string
    {
        return self::FIRST_NAMES[$i % count(self::FIRST_NAMES)].' '.self::LAST_NAMES[($i * 7) % count(self::LAST_NAMES)];
    }

    private function user(string $name, string $email, string $role): User
    {
        $user = new User(['name' => $name, 'email' => $email, 'role' => $role, 'status' => 'active']);
        // Direto no atributo: o cast da Model calcularia o hash de novo a cada conta
        $user->setRawAttributes($user->getAttributes() + ['password_hash' => $this->password]);
        $user->save();

        return $user;
    }

    private function mood(Bond $bond, CarbonInterface $day): void
    {
        $draw = mt_rand(1, 10);
        DailyMood::create([
            'bond_id' => $bond->id,
            'patient_id' => $bond->patient_id,
            'mood' => $draw <= 2 ? 'bad' : ($draw <= 5 ? 'neutral' : 'good'),
            'mood_date' => $day->toDateString(),
        ]);
    }

    private function report(Bond $bond, CarbonInterface $at): void
    {
        $report = new Report([
            'bond_id' => $bond->id,
            'patient_id' => $bond->patient_id,
            'body' => self::REPORTS[mt_rand(0, count(self::REPORTS) - 1)],
            'visibility' => mt_rand(1, 10) <= 7 ? 'shared' : 'private',
        ]);
        $report->created_at = $at;
        $report->save();
    }

    private function task(Bond $bond, User $psychologist, int $i, CarbonInterface $due, bool $done): void
    {
        $task = new Task([
            'bond_id' => $bond->id,
            'title' => self::TASKS[$i % count(self::TASKS)],
            'description' => 'Tarefa fictícia de demonstração. Anote como foi e leve para a próxima conversa.',
            'due_date' => $due,
            'created_by_user_id' => $psychologist->id,
            'completed_at' => $done ? $due->copy()->setTime(19, 0)->min(now()) : null,
        ]);
        $task->created_at = $due->copy()->subDays(5)->min(now());
        $task->save();
    }

    private function message(Bond $bond, User $sender, string $body, CarbonInterface $at, bool $read): void
    {
        $message = new Message([
            'bond_id' => $bond->id,
            'sender_user_id' => $sender->id,
            'body' => $body,
            'read_at' => $read ? $at : null,
        ]);
        $message->sent_at = $at;
        $message->save();
    }

    private function appointment(Bond $bond, User $psychologist, CarbonInterface $at): void
    {
        Appointment::create([
            'bond_id' => $bond->id,
            'scheduled_at' => $at,
            'status' => $at->isPast() ? 'done' : 'scheduled',
            'modality' => $at->day % 2 === 0 ? 'online' : 'presencial',
            'notes' => 'Consulta fictícia para demonstração.',
            'created_by_user_id' => $psychologist->id,
        ]);
    }

    private function notification(User $user, string $type, int $resourceId, CarbonInterface $at, bool $read): void
    {
        $notification = new Notification([
            'user_id' => $user->id,
            'type' => $type,
            'resource_id' => $resourceId,
            'read_at' => $read ? $at : null,
        ]);
        $notification->created_at = $at;
        $notification->save();
    }
}
