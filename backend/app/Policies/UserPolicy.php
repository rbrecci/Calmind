<?php

namespace App\Policies;

use App\Models\Bond;
use App\Models\User;

class UserPolicy
{
    // Foto e capa. Psicologo no catalogo e publico; fora dele (pendente, recusado, despublicado) so sai
    // para quem tem vinculo. Paciente e dado pessoal sensivel (LGPD) e so sai para ele mesmo, admin e
    // psicologo com vinculo que nao tenha sido recusado
    public function viewProfileImage(User $viewer, User $owner): bool
    {
        if ($viewer->id === $owner->id || $viewer->role === 'admin') {
            return true;
        }

        if ($owner->role === 'psychologist') {
            // Mesma condicao do catalogo em BondService
            $listed = $owner->status === 'active'
                && $owner->psychologist?->approval_status === 'approved'
                && $owner->psychologist?->profile_published_at !== null;

            return $listed || ($viewer->role === 'patient' && $this->bonded($owner, $viewer));
        }

        return $owner->role === 'patient' && $viewer->role === 'psychologist' && $this->bonded($viewer, $owner);
    }

    // Recusa e cancelamento gravam 'ended' sem accepted_at; encerrado com accepted_at ja foi ativo
    private function bonded(User $psychologist, User $patient): bool
    {
        return Bond::where('psychologist_id', $psychologist->psychologist?->id ?? 0)
            ->where('patient_id', $patient->patient?->id ?? 0)
            ->where(fn ($q) => $q->whereIn('status', ['pending', 'active'])->orWhereNotNull('accepted_at'))
            ->exists();
    }
}
