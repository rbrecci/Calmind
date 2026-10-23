<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Bond;
use App\Models\Patient;
use App\Models\Psychologist;
use App\Models\User;
use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BondService
{
    public const DEFAULT_PER_PAGE = 20;

    private const ACTIVE_BOND_INDEX = 'uq_one_active_bond_per_patient';

    public function hasActiveBond(Patient $patient): bool
    {
        return Bond::where('patient_id', $patient->id)->where('status', 'active')->exists();
    }

    // RF-12, RNF-50: a regra vive no indice unico. O if so antecipa a mensagem; quem decide e o banco.
    // A transacao de $work ja fez rollback quando a excecao chega aqui, entao nao sobra efeito parcial.
    public function guardActiveBondConflict(Closure $work, string $message): mixed
    {
        try {
            return $work();
        } catch (QueryException $e) {
            if (($e->errorInfo[1] ?? null) === 1062 && str_contains($e->getMessage(), self::ACTIVE_BOND_INDEX)) {
                throw new ApiException(409, $message);
            }

            throw $e;
        }
    }

    // RF-10, RN-09, CA-10.2
    public function request(User $user, int $psychologistId): Bond
    {
        $patient = $user->patient;

        $psychologist = Psychologist::whereKey($psychologistId)
            ->where('approval_status', 'approved')
            ->whereNotNull('profile_published_at')
            ->whereHas('user', fn ($q) => $q->where('status', 'active'))
            ->first();

        // Mesma mensagem para inexistente, nao aprovado, nao publicado e suspenso: nao revela o motivo
        if (! $psychologist) {
            throw ValidationException::withMessages(['psychologist_id' => ['Profissional indisponível.']]);
        }

        return DB::transaction(function () use ($patient, $psychologist) {
            // O schema nao tem indice para "uma solicitacao pendente por paciente" (so para ativo):
            // travar a linha do paciente serializa dois pedidos simultaneos antes das checagens abaixo
            Patient::whereKey($patient->id)->lockForUpdate()->first();

            if ($this->hasActiveBond($patient)) {
                throw new ApiException(409, 'Você já tem um vínculo ativo. Encerre o vínculo atual antes de usar um novo código.');
            }

            if (Bond::where('patient_id', $patient->id)->where('status', 'pending')->exists()) {
                throw new ApiException(409, 'Você já tem uma solicitação pendente.');
            }

            return Bond::create([
                'patient_id' => $patient->id,
                'psychologist_id' => $psychologist->id,
                'status' => 'pending',
                'origin' => 'catalog',
                'requested_at' => now(),
            ])->load('patient');
        });
    }

    // RF-11, CA-11.1
    public function accept(User $user, int $bondId): Bond
    {
        return $this->guardActiveBondConflict(
            fn () => DB::transaction(function () use ($user, $bondId) {
                $bond = $this->pendingRequestOf($user, $bondId);

                // Se o paciente ja ganhou outro vinculo ativo, este UPDATE estoura no indice unico
                $bond->update(['status' => 'active', 'responded_at' => now()]);

                return $bond->load('patient');
            }),
            'O paciente já possui um vínculo ativo.'
        );
    }

    // RF-11, CA-11.2: recusar encerra a solicitacao; o catalogo continua aberto para o paciente
    public function reject(User $user, int $bondId): Bond
    {
        return DB::transaction(function () use ($user, $bondId) {
            $bond = $this->pendingRequestOf($user, $bondId);

            $bond->update([
                'status' => 'ended',
                'responded_at' => now(),
                'ended_at' => now(),
                'ended_by_user_id' => $user->id,
            ]);

            return $bond->load('patient');
        });
    }

    // RF-13: qualquer das partes encerra. Terceiro e id inexistente dao o mesmo 404
    public function end(User $user, int $bondId): Bond
    {
        return DB::transaction(function () use ($user, $bondId) {
            $bond = Bond::whereKey($bondId)
                ->where(fn ($q) => $q
                    ->where('patient_id', $user->patient?->id)
                    ->orWhere('psychologist_id', $user->psychologist?->id))
                ->lockForUpdate()
                ->firstOrFail();

            if ($bond->status !== 'active') {
                throw new ApiException(409, 'Este vínculo já está encerrado ou ainda não foi aceito.');
            }

            $bond->update(['status' => 'ended', 'ended_at' => now(), 'ended_by_user_id' => $user->id]);

            return $bond->load('patient');
        });
    }

    // RF-09, RN-09, RN-14. CA-09.3: a ordem e neutra (nome, depois id), nunca por reputacao ou preco
    public function catalog(User $user, array $filters, int $perPage): LengthAwarePaginator
    {
        if ($this->hasActiveBond($user->patient)) {
            throw new ApiException(403, 'A busca por profissionais é liberada depois que o vínculo atual for encerrado.');
        }

        $query = Psychologist::query()
            ->join('users', 'users.id', '=', 'psychologists.user_id')
            ->select('psychologists.*', 'users.name')
            ->where('psychologists.approval_status', 'approved')
            ->whereNotNull('psychologists.profile_published_at')
            ->where('users.status', 'active')
            ->orderBy('users.name')
            ->orderBy('psychologists.id');

        foreach (['approach', 'specialty', 'region'] as $filter) {
            if (filled($filters[$filter] ?? null)) {
                $query->where('psychologists.profile_'.$filter, 'like', '%'.$this->escapeLike($filters[$filter]).'%');
            }
        }

        if (filled($filters['modality'] ?? null)) {
            $query->where('psychologists.profile_modality', $filters['modality']);
        }

        return $query->paginate($perPage);
    }

    // Solicitacao pendente do psicologo, travada. Alheia ou inexistente: 404 (nao confirma o id)
    private function pendingRequestOf(User $user, int $bondId): Bond
    {
        $bond = Bond::whereKey($bondId)
            ->where('psychologist_id', $user->psychologist?->id)
            ->lockForUpdate()
            ->firstOrFail();

        if ($bond->status !== 'pending') {
            throw new ApiException(409, 'Esta solicitação não está mais pendente.');
        }

        return $bond;
    }

    // % e _ digitados pelo paciente valem como texto, nao como curinga do LIKE
    private function escapeLike(string $value): string
    {
        return addcslashes($value, '\\%_');
    }
}
