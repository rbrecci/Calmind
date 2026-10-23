<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public const PASSWORD = 'senha-de-teste-123';

    // Hash calculado uma vez por processo: bcrypt a cada linha deixaria a suite lenta
    private static ?string $passwordHash = null;

    public function definition(): array
    {
        return [
            'name' => fake('pt_BR')->name(),
            'email' => fake()->unique()->userName().'@example.com',
            'password_hash' => self::$passwordHash ??= Hash::make(self::PASSWORD),
            'role' => 'patient',
            'status' => 'active',
        ];
    }

    public function psychologist(): static
    {
        return $this->state(['role' => 'psychologist']);
    }

    public function admin(): static
    {
        return $this->state(['role' => 'admin']);
    }
}
