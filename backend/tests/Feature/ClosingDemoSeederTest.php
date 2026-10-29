<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Bond;
use App\Models\ConsentAcceptance;
use App\Models\Message;
use App\Models\Notification;
use App\Models\User;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ClosingDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_seed_preserves_existing_accounts_and_adds_the_closing_demo(): void
    {
        $this->seed();

        $psychologist = User::where('email', UserSeeder::PSYCHOLOGIST_EMAIL)->firstOrFail();
        $patient = User::where('email', UserSeeder::BONDED_PATIENT_EMAIL)->firstOrFail();
        $requester = User::where('email', 'samwise.gamgee@example.com')->firstOrFail();
        $bond = Bond::where('patient_id', $patient->patient->id)
            ->where('psychologist_id', $psychologist->psychologist->id)
            ->where('status', 'active')->sole();

        $pending = Bond::where('patient_id', $requester->patient->id)->sole();
        $this->assertSame('pending', $pending->status);
        $this->assertSame('catalog', $pending->origin);
        $this->assertSame($psychologist->psychologist->id, $pending->psychologist_id);

        foreach (['frodo.bolseiro@example.com', 'harry.potter@example.com'] as $email) {
            $unbonded = User::where('email', $email)->firstOrFail();
            $this->assertSame(0, $unbonded->patient->bonds()->count());
        }

        $this->assertTrue(ConsentAcceptance::where('user_id', $patient->id)->whereNull('revoked_at')->exists());
        $this->assertSame(3, DB::table('reports')->where('bond_id', $bond->id)->where('visibility', 'shared')->count());
        $this->assertSame(2, DB::table('reports')->where('bond_id', $bond->id)->where('visibility', 'private')->count());

        $messages = Message::where('bond_id', $bond->id)->get();
        $this->assertCount(2, $messages);
        $this->assertEqualsCanonicalizing([$patient->id, $psychologist->id], $messages->pluck('sender_user_id')->all());
        foreach ($messages as $message) {
            $stored = DB::table('messages')->where('id', $message->id)->value('body');
            $this->assertNotSame($message->body, $stored);
            $this->assertStringNotContainsString($message->body, $stored);
            $this->assertSame($message->body, decrypt($stored, false));
        }

        $appointments = Appointment::where('bond_id', $bond->id)->orderBy('scheduled_at')->get();
        $this->assertCount(3, $appointments);
        $this->assertCount(2, $appointments->filter(fn (Appointment $appointment) => $appointment->scheduled_at->isFuture() && $appointment->status === 'scheduled'));
        $this->assertCount(1, $appointments->filter(fn (Appointment $appointment) => $appointment->scheduled_at->isPast() && $appointment->status === 'done'));

        $patientNotice = Notification::where('user_id', $patient->id)->whereNull('read_at')->sole();
        $this->assertSame('message.received', $patientNotice->type);
        $this->assertSame($psychologist->id, $messages->find($patientNotice->resource_id)->sender_user_id);

        $psychologistNotice = Notification::where('user_id', $psychologist->id)->whereNull('read_at')->sole();
        $this->assertSame('bond.requested', $psychologistNotice->type);
        $this->assertSame($pending->id, $psychologistNotice->resource_id);
    }
}
