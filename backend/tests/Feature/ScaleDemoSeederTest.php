<?php

namespace Tests\Feature;

use App\Models\Bond;
use App\Models\DailyMood;
use App\Models\Report;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\ScaleDemoSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ScaleDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_builds_a_large_dataset_once_on_top_of_the_default_seed(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(ScaleDemoSeeder::class);

        $psychologist = User::where('email', UserSeeder::PSYCHOLOGIST_EMAIL)->firstOrFail()->psychologist;
        $this->assertGreaterThanOrEqual(40, $psychologist->activeBondsCount());
        $this->assertGreaterThanOrEqual(8, Bond::where('psychologist_id', $psychologist->id)->where('status', 'pending')->count());
        $this->assertGreaterThan(300, Report::count());
        $this->assertGreaterThan(300, DailyMood::count());

        // As contas novas entram com a senha da massa, que o preparar-demo.sh troca
        $extra = User::where('email', 'escala.paciente001@example.com')->firstOrFail();
        $this->assertTrue(Hash::check(UserSeeder::PASSWORD, $extra->password_hash));

        $users = User::count();
        $this->seed(ScaleDemoSeeder::class);
        $this->assertSame($users, User::count());
    }
}
