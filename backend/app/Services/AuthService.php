<?php

namespace App\Services;

use App\Exceptions\InvalidCredentialsException;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    // RF-01: a conta e o perfil de paciente nascem juntos ou nao nascem
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password_hash' => $data['password'],
                'role' => $data['role'],
            ]);

            // Perfil de psicologo nasce no cadastro do CRP (RF-33), nao aqui
            if ($user->role === 'patient') {
                $user->patient()->create(Arr::only($data, [
                    'birth_date',
                    'phone',
                    'guardian_name',
                    'guardian_phone',
                    'guardian_relationship',
                ]));
            }

            return $user;
        });
    }

    // RF-02, CA-02.2, CA-45.2: conta suspensa nao entra e nao se distingue de senha errada
    public function login(string $email, string $password): string
    {
        $user = User::where('email', $email)->first();

        if (! $user || $user->status !== 'active' || ! Hash::check($password, $user->getAuthPassword())) {
            throw new InvalidCredentialsException;
        }

        return $user->createToken('mobile')->plainTextToken;
    }

    // RNF-09: encerra a sessao em todos os dispositivos
    public function logout(User $user): void
    {
        $user->tokens()->delete();
    }
}
