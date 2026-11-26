<?php

namespace App\Services;

use App\Models\ConsentAcceptance;
use App\Models\ConsentTerm;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConsentService
{
    public function current(string $type = 'general'): ?ConsentTerm
    {
        return ConsentTerm::where('type', $type)->where('effective_from', '<=', now())
            ->orderByDesc('effective_from')->orderByDesc('id')->first();
    }

    public function hasAccepted(User $user, string $type = 'general'): bool
    {
        $term = $this->current($type);

        return $term !== null && ConsentAcceptance::where('user_id', $user->id)
            ->where('consent_term_id', $term->id)->whereNull('revoked_at')->exists();
    }

    public function accept(User $user, int $termId): ConsentAcceptance
    {
        $term = ConsentTerm::find($termId);
        if ($term === null || $this->current($term->type)?->id !== $term->id) {
            throw ValidationException::withMessages(['consent_term_id' => ['Selecione o termo vigente.']]);
        }
        abort_if($term->type === 'ai_analysis' && $user->role !== 'patient', 403);

        return DB::transaction(function () use ($user, $term) {
            $acceptance = ConsentAcceptance::firstOrCreate(['user_id' => $user->id, 'consent_term_id' => $term->id]);
            $created = $acceptance->wasRecentlyCreated;
            $acceptance = ConsentAcceptance::whereKey($acceptance->id)->lockForUpdate()->firstOrFail();
            if ($acceptance->revoked_at !== null) {
                $acceptance->revoked_at = null;
                $acceptance->accepted_at = now();
                $acceptance->save();
            }
            $acceptance->wasRecentlyCreated = $created;

            return $acceptance->load('consentTerm');
        });
    }

    public function revoke(User $user, int $id): ConsentAcceptance
    {
        return DB::transaction(function () use ($user, $id) {
            $acceptance = ConsentAcceptance::where('user_id', $user->id)->lockForUpdate()->findOrFail($id);
            if ($acceptance->revoked_at === null) {
                $acceptance->update(['revoked_at' => now()]);
            }

            return $acceptance->load('consentTerm');
        });
    }
}
