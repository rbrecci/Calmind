<?php

namespace Database\Factories;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Patient>
 */
class PatientFactory extends Factory
{
    protected $model = Patient::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'birth_date' => now()->subYears(fake()->numberBetween(20, 50))->toDateString(),
        ];
    }

    // RF-01, CA-01.5: menor de 18 anos sempre com os tres dados do responsavel
    public function minor(): static
    {
        return $this->state([
            'birth_date' => now()->subYears(15)->toDateString(),
            'guardian_name' => fake('pt_BR')->name(),
            'guardian_phone' => '11999990000',
            'guardian_relationship' => 'mae',
        ]);
    }
}
