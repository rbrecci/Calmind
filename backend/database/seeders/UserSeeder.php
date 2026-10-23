<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    // A colecao do Postman usa estas duas credenciais do administrador
    public const ADMIN_EMAIL = 'admin@plataforma.local';

    public const ADMIN_PASSWORD = 'admin-de-teste-123';

    public const PASSWORD = 'senha-de-teste-123';

    public const PSYCHOLOGIST_EMAIL = 'hermione.granger@example.com';

    public const BONDED_PATIENT_EMAIL = 'elizabeth.bennet@example.com';

    public function run(): void
    {
        $admin = User::create([
            'name' => 'Administrador Calmind',
            'email' => self::ADMIN_EMAIL,
            'password_hash' => self::ADMIN_PASSWORD,
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->approvedPsychologist($admin, 'Hermione Granger', self::PSYCHOLOGIST_EMAIL, '000001', [
            'profile_approach' => 'Terapia cognitivo-comportamental',
            'profile_specialty' => 'Ansiedade e estresse',
            'profile_modality' => 'online',
            'profile_region' => 'São Paulo, SP',
            'profile_bio' => 'Atendo adolescentes e adultos com foco em ansiedade. Trabalho com metas pequenas e acompanhamento semanal.',
        ]);

        $this->approvedPsychologist($admin, 'Atticus Finch', 'atticus.finch@example.com', '000002', [
            'profile_approach' => 'Psicanálise',
            'profile_specialty' => 'Luto e relacionamentos',
            'profile_modality' => 'ambos',
            'profile_region' => 'Campinas, SP',
            'profile_bio' => 'Escuta clínica para adultos em momentos de perda e mudança. Atendo presencialmente e por vídeo.',
        ]);

        // Pendente: alvo da fila de aprovacao do administrador (RF-44)
        $pending = User::create([
            'name' => 'Jane Marple',
            'email' => 'jane.marple@example.com',
            'password_hash' => self::PASSWORD,
            'role' => 'psychologist',
            'status' => 'active',
        ]);
        Psychologist::create([
            'user_id' => $pending->id,
            'crp_number' => '000003',
            'crp_region' => '06',
            'approval_status' => 'pending',
        ]);

        $this->patient('Frodo Bolseiro', 'frodo.bolseiro@example.com', '2000-05-10');

        // CA-01.5: menor de 18 anos, os tres campos do responsavel preenchidos (ck_patients_guardian)
        $this->patient('Harry Potter', 'harry.potter@example.com', now()->subYears(15)->toDateString(), [
            'guardian_name' => 'Lily Potter',
            'guardian_phone' => '(11) 90000-0001',
            'guardian_relationship' => 'mãe',
        ]);

        $this->patient('Elizabeth Bennet', self::BONDED_PATIENT_EMAIL, '2001-09-17');
    }

    private function approvedPsychologist(User $admin, string $name, string $email, string $crpNumber, array $profile): void
    {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password_hash' => self::PASSWORD,
            'role' => 'psychologist',
            'status' => 'active',
        ]);

        Psychologist::create([
            'user_id' => $user->id,
            'crp_number' => $crpNumber,
            'crp_region' => '06',
            'approval_status' => 'approved',
            'approved_by_user_id' => $admin->id,
            'approval_decided_at' => now(),
            'profile_published_at' => now(),
        ] + $profile);
    }

    private function patient(string $name, string $email, string $birthDate, array $guardian = []): void
    {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password_hash' => self::PASSWORD,
            'role' => 'patient',
            'status' => 'active',
        ]);

        Patient::create([
            'user_id' => $user->id,
            'birth_date' => $birthDate,
        ] + $guardian);
    }
}
