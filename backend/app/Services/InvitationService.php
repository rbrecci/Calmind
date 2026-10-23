<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\AuditLog;
use App\Models\Bond;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class InvitationService
{
    // RNF-05, RN-16: 24 letras maiusculas (sem I e O) e os digitos 2 a 9. Sem 0/O e sem 1/I/l
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    private const CODE_LENGTH = 8;

    private const MAX_GENERATION_ATTEMPTS = 5;

    private const INVALID_CODE = 'Código de convite inválido ou expirado.';

    private const ACTIVE_BOND = 'Você já tem um vínculo ativo. Encerre o vínculo atual antes de usar um novo código.';

    public function __construct(private BondService $bonds) {}

    // RF-06, CA-06.3: so psicologo aprovado gera convite
    public function generate(User $user): Invitation
    {
        $psychologist = $user->psychologist;

        if (! $psychologist || $psychologist->approval_status !== 'approved') {
            throw new ApiException(403, 'Seu cadastro profissional ainda não foi aprovado.');
        }

        for ($attempt = 1; ; $attempt++) {
            try {
                return $psychologist->invitations()->create([
                    'code' => $this->newCode(),
                    'expires_at' => now()->addDays(config('calmind.invitation.ttl_days')),
                ]);
            } catch (QueryException $e) {
                // O indice uq_invitation_code decide a colisao; so ela justifica sortear de novo
                if (! str_contains($e->getMessage(), 'uq_invitation_code') || $attempt >= self::MAX_GENERATION_ATTEMPTS) {
                    throw $e;
                }
            }
        }
    }

    // RF-08: 404 para convite alheio (nao confirma que o id existe), 409 se ja virou vinculo
    public function revoke(User $user, int $invitationId): Invitation
    {
        return DB::transaction(function () use ($user, $invitationId) {
            // Trava a linha: o resgate concorrente trava a mesma, entao um dos dois espera o outro
            $invitation = Invitation::whereKey($invitationId)
                ->where('psychologist_id', $user->psychologist?->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($invitation->consumed_at) {
                throw new ApiException(409, 'Este convite já gerou um vínculo. Para encerrar o acompanhamento, encerre o vínculo.');
            }

            // Idempotente: repetir a revogacao nao desloca a data da primeira
            if (! $invitation->revoked_at) {
                $invitation->update(['revoked_at' => now()]);
            }

            return $invitation;
        });
    }

    // RF-07. A ordem importa: limite (RNF-06), codigo (CA-07.2), vinculo ativo (CA-07.4), gravacao
    public function redeem(User $user, string $rawCode, ?string $ip): Bond
    {
        $patient = $user->patient;
        $key = 'redeem-invitation:'.$user->id.'|'.$ip;

        if (RateLimiter::tooManyAttempts($key, config('calmind.invitation.max_attempts'))) {
            // RNF-06: o bloqueio fica registrado. Tentativa negada tambem entra na trilha (CA-17.3)
            AuditLog::create([
                'actor_user_id' => $user->id,
                'action' => 'redeem_invitation_blocked',
                'resource_type' => 'invitation',
                'resource_id' => null,
                'result' => 'denied',
            ]);

            throw new ThrottleRequestsException('', null, ['Retry-After' => RateLimiter::availableIn($key)]);
        }

        $invitation = Invitation::where('code', strtoupper(trim($rawCode)))->first();

        if (! $invitation || ! $this->isRedeemable($invitation)) {
            $this->failAttempt($key);
        }

        if ($this->bonds->hasActiveBond($patient)) {
            throw new ApiException(409, self::ACTIVE_BOND);
        }

        $bond = $this->bonds->guardActiveBondConflict(
            fn () => DB::transaction(function () use ($invitation, $patient, $key) {
                // Revalida sob trava: duas pessoas digitando o mesmo codigo ao mesmo tempo
                $locked = Invitation::whereKey($invitation->id)->lockForUpdate()->first();

                if (! $this->isRedeemable($locked)) {
                    $this->failAttempt($key);
                }

                $bond = Bond::create([
                    'patient_id' => $patient->id,
                    'psychologist_id' => $locked->psychologist_id,
                    'status' => 'active',
                    'origin' => 'invitation',
                    'invitation_id' => $locked->id,
                    'requested_at' => now(),
                    'responded_at' => now(),
                ]);

                $locked->update(['consumed_at' => now(), 'consumed_by_patient_id' => $patient->id]);

                return $bond;
            }),
            self::ACTIVE_BOND
        );

        RateLimiter::clear($key);

        return $bond->load('patient');
    }

    private function isRedeemable(Invitation $invitation): bool
    {
        return $invitation->consumed_at === null
            && $invitation->revoked_at === null
            && $invitation->expires_at->isFuture();
    }

    // CA-07.2: um unico 422 para inexistente, expirado, consumido e revogado
    private function failAttempt(string $key): never
    {
        RateLimiter::hit($key, config('calmind.invitation.attempt_window_minutes') * 60);

        throw ValidationException::withMessages(['code' => [self::INVALID_CODE]]);
    }

    // RNF-05: CSPRNG, sem relacao com dado do psicologo
    private function newCode(): string
    {
        $last = strlen(self::ALPHABET) - 1;
        $code = '';

        for ($i = 0; $i < self::CODE_LENGTH; $i++) {
            $code .= self::ALPHABET[random_int(0, $last)];
        }

        return $code;
    }
}
