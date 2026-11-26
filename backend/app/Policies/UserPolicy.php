<?php

namespace App\Policies;

use App\Models\Bond;
use App\Models\User;

class UserPolicy
{
    // Foto e capa. Psicologo e publico no catalogo; paciente e dado pessoal sensivel (LGPD) e so sai
    // para ele mesmo, admin e psicologo com vinculo que nao tenha sido recusado
    public function viewProfileImage(User $viewer, User $owner): bool
    {
        if ($viewer->id === $owner->id || $viewer->role === 'admin' || $owner->role === 'psychologist') {
            return true;
        }

        if ($owner->role !== 'patient' || $viewer->role !== 'psychologist') {
            return false;
        }

        // Recusa e cancelamento gravam 'ended' sem accepted_at; encerrado com accepted_at ja foi ativo
        return Bond::where('psychologist_id', $viewer->psychologist?->id ?? 0)
            ->where('patient_id', $owner->patient?->id ?? 0)
            ->where(fn ($q) => $q->whereIn('status', ['pending', 'active'])->orWhereNotNull('accepted_at'))
            ->exists();
    }
}
