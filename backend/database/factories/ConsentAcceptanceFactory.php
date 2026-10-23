<?php

namespace Database\Factories;

use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ConsentAcceptance>
 */
class ConsentAcceptanceFactory extends Factory
{
    protected $model = ConsentAcceptance::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'consent_term_id' => ConsentTerm::factory(),
        ];
    }

    // CA-04.3: revogacao sem efeito retroativo
    public function revoked(): static
    {
        return $this->state(['revoked_at' => now()]);
    }
}
