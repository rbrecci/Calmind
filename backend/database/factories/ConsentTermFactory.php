<?php

namespace Database\Factories;

use App\Models\ConsentTerm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ConsentTerm>
 */
class ConsentTermFactory extends Factory
{
    protected $model = ConsentTerm::class;

    public function definition(): array
    {
        return [
            'type' => 'general',
            'version' => '1.0',
            'body' => 'Termo de consentimento fictício, apenas para teste.',
            'effective_from' => now()->subDay(),
        ];
    }
}
