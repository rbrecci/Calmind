<?php

namespace Tests\Feature;

use App\Models\ConsentTerm;
use App\Services\ConsentService;
use Database\Seeders\ConsentTermSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsentTermMoodTest extends TestCase
{
    use RefreshDatabase;

    private function publish(): void
    {
        (require database_path('migrations/2026_11_27_000002_publish_consent_term_with_mood.php'))->up();
    }

    public function test_existing_database_gets_a_new_version_that_cites_the_mood_once(): void
    {
        ConsentTerm::factory()->create(['type' => 'general', 'version' => '1.0', 'body' => 'Texto antigo.', 'effective_from' => now()->subMonth()]);

        $this->publish();
        $this->publish();

        $this->assertSame(2, ConsentTerm::where('type', 'general')->count());
        $current = app(ConsentService::class)->current();
        $this->assertSame('1.1', $current->version);
        $this->assertStringContainsString('humor', $current->body);
    }

    public function test_the_seeded_text_already_cites_the_mood(): void
    {
        $this->assertStringContainsString('o humor que você marca no calendário', ConsentTermSeeder::generalBody());
        $this->publish();
        $this->assertSame(0, ConsentTerm::count());
    }
}
