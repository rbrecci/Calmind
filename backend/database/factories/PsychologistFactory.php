<?php

namespace Database\Factories;

use App\Models\Psychologist;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Psychologist>
 */
class PsychologistFactory extends Factory
{
    protected $model = Psychologist::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->psychologist(),
            'crp_number' => fake()->unique()->numerify('######'),
            'crp_region' => '06',
            'approval_status' => 'pending',
        ];
    }

    public function approved(): static
    {
        return $this->state(['approval_status' => 'approved']);
    }

    // CA-34.2: so aparece no catalogo quem esta aprovado e com perfil publicado
    public function published(): static
    {
        return $this->approved()->state(['profile_published_at' => now()]);
    }
}
