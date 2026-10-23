<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\Report;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PsychologistApprovalReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_rejected_professional_with_old_bond_cannot_read_shared_reports(): void
    {
        $bond = Bond::factory()->active()->create();
        $report = Report::factory()->forBond($bond)->shared()->create();
        $psychologist = $bond->psychologist;
        $token = $psychologist->user->createToken('mobile')->plainTextToken;

        $this->getJson("/api/v1/psychologist/reports/{$report->id}", ['Authorization' => 'Bearer '.$token])
            ->assertOk();

        $psychologist->update(['approval_status' => 'rejected', 'profile_published_at' => null]);

        $this->getJson("/api/v1/psychologist/reports/{$report->id}", ['Authorization' => 'Bearer '.$token])
            ->assertNotFound();
        $this->getJson("/api/v1/psychologist/patients/{$bond->patient->user_id}/reports", ['Authorization' => 'Bearer '.$token])
            ->assertNotFound();
    }
}
