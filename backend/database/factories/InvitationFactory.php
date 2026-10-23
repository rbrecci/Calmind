<?php

namespace Database\Factories;

use App\Models\Invitation;
use App\Models\Patient;
use App\Models\Psychologist;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invitation>
 */
class InvitationFactory extends Factory
{
    protected $model = Invitation::class;

    public function definition(): array
    {
        return [
            'psychologist_id' => Psychologist::factory()->approved(),
            // RNF-05: mesmo alfabeto do gerador de producao (sem 0/O e 1/I/l)
            'code' => fake()->unique()->regexify('[A-HJ-NP-Z2-9]{8}'),
            'expires_at' => now()->addDays(config('calmind.invitation.ttl_days')),
        ];
    }

    public function expired(): static
    {
        return $this->state(['expires_at' => now()->subMinute()]);
    }

    public function revoked(): static
    {
        return $this->state(['revoked_at' => now()]);
    }

    public function consumed(): static
    {
        return $this->state(fn () => [
            'consumed_at' => now(),
            'consumed_by_patient_id' => Patient::factory(),
        ]);
    }
}
