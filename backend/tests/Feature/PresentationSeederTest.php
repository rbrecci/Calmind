<?php

namespace Tests\Feature;

use App\Models\Analysis;
use App\Models\ConsentAcceptance;
use App\Models\Medication;
use App\Models\MedicationIntake;
use App\Models\User;
use Database\Seeders\PresentationSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PresentationSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // meio do dia: o horario das 08:00 de hoje ja venceu, o das 22:00 ainda nao
        $this->travelTo(today()->setTime(12, 0));
        config(['services.ai.provider' => 'simulated']);
        $this->seed();
    }

    public function test_patient_sees_medication_in_every_state_and_ai_term_accepted(): void
    {
        $patient = User::where('email', UserSeeder::BONDED_PATIENT_EMAIL)->firstOrFail();
        $this->withToken($patient->createToken('mobile')->plainTextToken);

        $list = $this->getJson('/api/v1/patient/medications')->assertOk()->assertJsonPath('meta.total', 4)->json('data');
        $this->assertSame(['awaiting_confirmation', 'active', 'suspended', 'refused'], array_column($list, 'status'));
        $this->assertSame('patient', $list[2]['suspended_by']);
        $this->assertNotEmpty($list[3]['refusal_reason']);

        $from = today()->subDays(4)->toDateString();
        $to = today()->toDateString();
        $doses = $this->getJson("/api/v1/patient/medications/doses?from={$from}&to={$to}")->assertOk()->json('data');
        $this->assertSame([true, true, false, true, false], array_column($doses, 'taken'));

        $this->getJson('/api/v1/consent-terms/current?type=ai_analysis')->assertOk()->assertJsonPath('accepted', true);
    }

    public function test_psychologist_has_a_confirmed_analysis_in_the_record_and_can_request_another(): void
    {
        $psychologist = User::where('email', UserSeeder::PSYCHOLOGIST_EMAIL)->firstOrFail();
        $patient = User::where('email', UserSeeder::BONDED_PATIENT_EMAIL)->firstOrFail();
        $bondId = $patient->patient->bonds()->where('status', 'active')->sole()->id;
        $this->withToken($psychologist->createToken('mobile')->plainTextToken);

        $analyses = $this->getJson("/api/v1/psychologist/analyses?bond_id={$bondId}")->assertOk()
            ->assertJsonPath('meta.total', 1)->json('data');
        $this->assertStringStartsWith('[EXEMPLO DE DEMONSTRAÇÃO, não gerado pela IA]', $analyses[0]['summary']);
        $this->assertSame($psychologist->id, $analyses[0]['confirmed_by_user_id']);

        // RNF-08: a analise semeada so usa relato compartilhado
        $used = DB::table('analysis_reports')->join('reports', 'reports.id', '=', 'analysis_reports.report_id')
            ->where('analysis_id', $analyses[0]['id'])->pluck('visibility');
        $this->assertCount(3, $used);
        $this->assertSame(['shared'], $used->unique()->values()->all());

        $this->getJson("/api/v1/psychologist/patients/{$patient->id}/record")->assertOk()
            ->assertJsonPath('totals.medication', 4)
            ->assertJsonPath('totals.analysis', 1);

        $this->postJson('/api/v1/psychologist/analyses', [
            'bond_id' => $bondId,
            'period_start' => today()->subDays(7)->toDateString(),
            'period_end' => today()->toDateString(),
        ])->assertCreated()->assertJsonPath('status', 'generated');
    }

    public function test_running_it_again_does_not_duplicate_anything(): void
    {
        $count = fn () => [Medication::count(), MedicationIntake::count(), Analysis::count(), ConsentAcceptance::count()];
        $before = $count();

        $this->seed(PresentationSeeder::class);

        $this->assertSame($before, $count());
        $this->assertSame([4, 3, 1], array_slice($before, 0, 3));
    }
}
