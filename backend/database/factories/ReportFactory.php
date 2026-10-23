<?php

namespace Database\Factories;

use App\Models\Bond;
use App\Models\Report;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Report>
 */
class ReportFactory extends Factory
{
    protected $model = Report::class;

    public function definition(): array
    {
        return [
            'bond_id' => Bond::factory()->active(),
            // Coerente com o vinculo: o relato e sempre do paciente do proprio vinculo
            'patient_id' => fn (array $attributes) => Bond::findOrFail($attributes['bond_id'])->patient_id,
            'body' => 'Relato fictício '.fake()->unique()->numberBetween(1, 999999),
            'visibility' => 'shared',
            'created_at' => now(),
        ];
    }

    public function forBond(Bond $bond): static
    {
        return $this->state(['bond_id' => $bond->id, 'patient_id' => $bond->patient_id]);
    }

    public function shared(): static
    {
        return $this->state(['visibility' => 'shared']);
    }

    public function private(): static
    {
        return $this->state(['visibility' => 'private']);
    }

    // RF-24: compartilhado que o paciente despublicou
    public function unpublished(): static
    {
        return $this->state(['visibility' => 'shared', 'unpublished_at' => now()]);
    }
}
