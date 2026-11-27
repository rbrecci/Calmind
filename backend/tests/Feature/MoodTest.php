<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\DailyMood;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\Report;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MoodTest extends TestCase
{
    use RefreshDatabase;

    private ?ConsentTerm $term = null;

    private function consented(Patient $patient): void
    {
        $this->term ??= ConsentTerm::factory()->create();
        ConsentAcceptance::factory()->create(['user_id' => $patient->user_id, 'consent_term_id' => $this->term->id]);
    }

    private function activeBond(): Bond
    {
        $bond = Bond::factory()->active()->create();
        $this->consented($bond->patient);

        return $bond;
    }

    public function test_patient_marks_today_and_remarking_replaces_the_value(): void
    {
        $bond = $this->activeBond();
        Sanctum::actingAs($bond->patient->user);

        $this->putJson('/api/v1/patient/moods/today', ['mood' => 'bad'])
            ->assertOk()->assertExactJson(['date' => today()->toDateString(), 'mood' => 'bad']);
        $this->putJson('/api/v1/patient/moods/today', ['mood' => 'good'])->assertOk();

        $this->assertSame(1, DailyMood::count());
        $this->getJson('/api/v1/patient/moods')->assertOk()->assertExactJson([
            'data' => [['date' => today()->toDateString(), 'mood' => 'good']],
            'meta' => ['total' => 1, 'page' => 1, 'per_page' => 31],
        ]);
    }

    public function test_invalid_mood_is_rejected(): void
    {
        Sanctum::actingAs($this->activeBond()->patient->user);

        $this->putJson('/api/v1/patient/moods/today', ['mood' => 'great'])
            ->assertStatus(422)->assertJsonValidationErrors('mood');
        $this->assertSame(0, DailyMood::count());
    }

    public function test_marking_requires_consent_and_active_bond(): void
    {
        $this->term = ConsentTerm::factory()->create();
        $withoutConsent = Bond::factory()->active()->create();
        Sanctum::actingAs($withoutConsent->patient->user);
        $this->putJson('/api/v1/patient/moods/today', ['mood' => 'good'])->assertForbidden();

        $loner = Patient::factory()->create();
        $this->consented($loner);
        Sanctum::actingAs($loner->user);
        $this->putJson('/api/v1/patient/moods/today', ['mood' => 'good'])->assertStatus(409);

        $this->assertSame(0, DailyMood::count());
    }

    public function test_psychologist_of_the_bond_reads_the_period_and_it_is_audited(): void
    {
        $bond = $this->activeBond();
        foreach (['2026-10-31' => 'bad', '2026-11-01' => 'neutral', '2026-11-30' => 'good', '2026-12-01' => 'bad'] as $date => $mood) {
            DailyMood::create(['bond_id' => $bond->id, 'patient_id' => $bond->patient_id, 'mood' => $mood, 'mood_date' => $date]);
        }
        Sanctum::actingAs($bond->psychologist->user);

        $this->getJson("/api/v1/psychologist/patients/{$bond->patient->user_id}/moods?from=2026-11-01&to=2026-11-30")
            ->assertOk()
            ->assertJsonPath('data', [['date' => '2026-11-30', 'mood' => 'good'], ['date' => '2026-11-01', 'mood' => 'neutral']])
            ->assertJsonPath('meta.total', 2);

        $this->assertDatabaseHas('audit_logs', ['action' => 'read_patient_moods', 'result' => 'allowed']);
    }

    public function test_psychologist_without_bond_gets_404(): void
    {
        $bond = $this->activeBond();
        Sanctum::actingAs(Psychologist::factory()->approved()->create()->user);

        $this->getJson("/api/v1/psychologist/patients/{$bond->patient->user_id}/moods")->assertNotFound();
        $this->assertDatabaseHas('audit_logs', ['action' => 'read_patient_moods', 'result' => 'denied']);
    }

    public function test_report_period_filter_keeps_private_reports_away_from_the_psychologist(): void
    {
        $bond = $this->activeBond();
        foreach ([['2026-11-10 10:00:00', 'shared'], ['2026-11-10 11:00:00', 'private'], ['2026-10-10 10:00:00', 'shared']] as [$at, $visibility]) {
            $report = Report::create(['bond_id' => $bond->id, 'patient_id' => $bond->patient_id, 'body' => 'texto', 'visibility' => $visibility]);
            DB::table('reports')->where('id', $report->id)->update(['created_at' => $at]);
        }
        $query = 'from=2026-11-01&to=2026-11-30';

        Sanctum::actingAs($bond->psychologist->user);
        $this->getJson("/api/v1/psychologist/patients/{$bond->patient->user_id}/reports?{$query}")
            ->assertOk()->assertJsonPath('meta.total', 1);

        Sanctum::actingAs($bond->patient->user);
        $this->getJson("/api/v1/patient/reports?{$query}")->assertOk()->assertJsonPath('meta.total', 2);
    }

    public function test_bond_days_and_active_bonds_are_provided(): void
    {
        $this->travelTo('2026-11-27 09:00:00');
        $psychologist = Psychologist::factory()->approved()->create();
        $bond = Bond::factory()->active()->create(['psychologist_id' => $psychologist->id, 'accepted_at' => '2026-11-17 23:00:00']);
        Bond::factory()->active()->create(['psychologist_id' => $psychologist->id]);
        Bond::factory()->create(['psychologist_id' => $psychologist->id]);
        Bond::factory()->ended()->create(['psychologist_id' => $psychologist->id]);

        Sanctum::actingAs($bond->patient->user);
        $this->getJson('/api/v1/patient/bonds')->assertOk()->assertJsonPath('data.0.bond_days', 10);

        Sanctum::actingAs($psychologist->user);
        $this->getJson('/api/v1/psychologist/profile')->assertOk()->assertJsonPath('active_bonds', 2);
    }
}
