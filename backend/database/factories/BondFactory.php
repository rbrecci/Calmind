<?php

namespace Database\Factories;

use App\Models\Bond;
use App\Models\Patient;
use App\Models\Psychologist;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bond>
 */
class BondFactory extends Factory
{
    protected $model = Bond::class;

    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(),
            'psychologist_id' => Psychologist::factory()->approved(),
            'status' => 'pending',
            'origin' => 'catalog',
            'requested_at' => now(),
        ];
    }

    public function active(): static
    {
        return $this->state(['status' => 'active', 'responded_at' => now()]);
    }

    public function ended(): static
    {
        return $this->state(['status' => 'ended', 'ended_at' => now()]);
    }
}
