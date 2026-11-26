<?php

namespace Database\Seeders;

use App\Models\Analysis;
use App\Models\AnalysisReport;
use App\Models\AnalysisVersion;
use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\Medication;
use App\Models\MedicationIntake;
use App\Models\SharedReport;
use App\Models\User;
use Illuminate\Database\Seeder;

// Massa para ensaiar a apresentacao sem montar tudo pela API: medicacao em cada estado, aceite do
// termo de IA e uma analise ja confirmada, no vinculo da paciente de demonstracao.
// Pode rodar de novo num banco ja semeado: o que existe nao e duplicado.
// Nao cria notificacao: o app ainda nao tem texto para os tipos de medicacao.
class PresentationSeeder extends Seeder
{
    // O resumo semeado NAO saiu da IA. O prefixo impede que seja apresentado como se fosse.
    public const ANALYSIS_BODY = "[EXEMPLO DE DEMONSTRAÇÃO, não gerado pela IA]\n"
        ."- Sono melhorou: três noites seguidas sem acordar de madrugada, ainda com cansaço ao acordar.\n"
        ."- Ansiedade antes de uma reunião; a respiração combinada ajudou a diminuir o aperto no peito.\n"
        .'- Conversou com a irmã sobre o que anda pesando e sentiu alívio.';

    public function run(): void
    {
        $psychologist = User::where('email', UserSeeder::PSYCHOLOGIST_EMAIL)->firstOrFail();
        $patient = User::where('email', UserSeeder::BONDED_PATIENT_EMAIL)->firstOrFail();
        $bond = Bond::where('patient_id', $patient->patient->id)
            ->where('psychologist_id', $psychologist->psychologist->id)
            ->where('status', 'active')->firstOrFail();

        $this->medications($bond, $psychologist, $patient);
        $this->aiConsent($patient);
        $this->confirmedAnalysis($bond, $psychologist);
    }

    private function medications(Bond $bond, User $psychologist, User $patient): void
    {
        if (Medication::where('bond_id', $bond->id)->exists()) {
            return;
        }

        $everyDay = range(0, 6);

        // Ativa: com tomadas marcadas e uma esquecida anteontem. A de hoje fica para marcar na hora.
        $active = $this->medication($bond, $psychologist, 'Sertralina', '50 mg', $everyDay, '08:00', 8, [
            'status' => 'active',
            'confirmed_at' => now()->subDays(7),
        ]);
        foreach ([4, 3, 1] as $daysAgo) {
            $slot = today()->subDays($daysAgo)->setTime(8, 0);
            $intake = new MedicationIntake(['medication_id' => $active->id, 'scheduled_for' => $slot]);
            $intake->marked_at = $slot->copy()->addMinutes(12);
            $intake->save();
        }

        // Aguardando confirmacao: para confirmar ou recusar ao vivo
        $this->medication($bond, $psychologist, 'Melatonina', '3 mg', $everyDay, '22:00', 1, [
            'status' => 'awaiting_confirmation',
        ]);

        $this->medication($bond, $psychologist, 'Escitalopram', '10 mg', $everyDay, '09:00', 20, [
            'status' => 'suspended',
            'confirmed_at' => now()->subDays(19),
            'suspended_at' => now()->subDays(9),
            'suspended_by_user_id' => $patient->id,
        ]);

        $this->medication($bond, $psychologist, 'Fluoxetina', '20 mg', [1, 3, 5], '07:30', 25, [
            'status' => 'refused',
            'refused_at' => now()->subDays(24),
            'refusal_reason' => 'O psiquiatra trocou o remédio antes de eu começar.',
        ]);
    }

    private function medication(Bond $bond, User $psychologist, string $name, string $dosage, array $weekdays, string $time, int $daysAgo, array $state): Medication
    {
        $medication = new Medication($state + [
            'bond_id' => $bond->id,
            'name' => $name,
            'dosage' => $dosage,
            'prescription_source' => 'Dr. John Watson, psiquiatra (fictício)',
            'registered_by_user_id' => $psychologist->id,
        ]);
        $medication->created_at = now()->subDays($daysAgo);
        $medication->save();

        foreach ($weekdays as $weekday) {
            $medication->schedules()->create(['weekday' => $weekday, 'time_of_day' => $time.':00']);
        }

        return $medication;
    }

    // RF-04: sem este aceite toda analise responde 403. Aceite revogado no ensaio continua revogado.
    private function aiConsent(User $patient): void
    {
        $term = ConsentTerm::where('type', 'ai_analysis')->where('effective_from', '<=', now())
            ->orderByDesc('effective_from')->orderByDesc('id')->firstOrFail();

        ConsentAcceptance::firstOrCreate(['user_id' => $patient->id, 'consent_term_id' => $term->id]);
    }

    private function confirmedAnalysis(Bond $bond, User $psychologist): void
    {
        if (Analysis::where('bond_id', $bond->id)->where('status', 'confirmed')->exists()) {
            return;
        }

        $confirmedAt = now()->subDay();
        $start = $confirmedAt->copy()->subDays(6)->startOfDay();
        // RNF-08: so pela view, como o servico de analise faz
        $reports = SharedReport::query()->where('bond_id', $bond->id)
            ->whereBetween('created_at', [$start, $confirmedAt])->pluck('id');
        if ($reports->isEmpty()) {
            return;
        }

        $analysis = new Analysis([
            'bond_id' => $bond->id,
            'requested_by_user_id' => $psychologist->id,
            'period_start' => $start->toDateString(),
            'period_end' => $confirmedAt->toDateString(),
            'status' => 'confirmed',
            'confirmed_at' => $confirmedAt,
        ]);
        $analysis->requested_at = $confirmedAt->copy()->subMinutes(5);
        $analysis->save();

        foreach ($reports as $reportId) {
            AnalysisReport::create(['analysis_id' => $analysis->id, 'report_id' => $reportId]);
        }

        $version = new AnalysisVersion([
            'analysis_id' => $analysis->id,
            'body' => self::ANALYSIS_BODY,
            'edited_by_user_id' => $psychologist->id,
        ]);
        $version->edited_at = $confirmedAt;
        $version->save();
    }
}
