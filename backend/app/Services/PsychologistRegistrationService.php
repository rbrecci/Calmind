<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Psychologist;
use App\Models\PsychologistDocument;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PsychologistRegistrationService
{
    public function register(User $user, array $data, UploadedFile $document): Psychologist
    {
        $current = $user->psychologist;

        if ($current?->approval_status === 'approved') {
            throw new ApiException(409, 'Este cadastro profissional já foi aprovado.');
        }

        $path = $document->store('psychologist-documents', 'local');

        try {
            return DB::transaction(function () use ($user, $data, $document, $path, $current) {
                $psychologist = $current ?? new Psychologist(['user_id' => $user->id]);
                $psychologist->fill([
                    'crp_region' => $data['crp_region'],
                    'crp_number' => $data['crp_number'],
                    'approval_status' => 'pending',
                    'approval_note' => null,
                    'approved_by_user_id' => null,
                    'approval_decided_at' => null,
                    'profile_published_at' => null,
                ]);
                $psychologist->save();

                $psychologist->documents()->create([
                    'file_path' => $path,
                    'original_name' => $document->getClientOriginalName(),
                    'mime_type' => $document->getMimeType(),
                ]);

                return $psychologist->load('documents');
            });
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($path);
            throw $e;
        }
    }

    public function updateProfile(User $user, array $data): Psychologist
    {
        $psychologist = $this->approvedProfile($user);
        $psychologist->fill($data);

        if ($psychologist->isDirty() && $psychologist->profile_published_at !== null) {
            $psychologist->profile_published_at = null;
        }

        $psychologist->save();

        return $psychologist;
    }

    public function publish(User $user): Psychologist
    {
        $psychologist = $this->approvedProfile($user);

        if (trim((string) $psychologist->profile_bio) === '') {
            throw ValidationException::withMessages(['profile_bio' => ['Escreva uma apresentação antes de publicar.']]);
        }

        $profile = implode(' ', array_filter([
            $psychologist->profile_approach,
            $psychologist->profile_specialty,
            $psychologist->profile_region,
            $psychologist->profile_bio,
        ]));

        if (preg_match('/(?:R\$\s*\d|\b(?:preço|valor|honorário|reais|desconto|promoção|grátis|gratuito)\b)/iu', $profile)) {
            throw ValidationException::withMessages([
                'profile_bio' => ['O perfil não pode divulgar valores ou expressões promocionais.'],
            ]);
        }

        $psychologist->update(['profile_published_at' => now()]);

        return $psychologist;
    }

    public function decide(User $admin, int $id, string $decision, ?string $reason = null): Psychologist
    {
        return DB::transaction(function () use ($admin, $id, $decision, $reason) {
            $psychologist = Psychologist::whereKey($id)->lockForUpdate()->firstOrFail();

            if ($psychologist->approval_status !== 'pending') {
                throw new ApiException(409, 'Este cadastro não está pendente.');
            }

            if ($decision === 'approved' && ! $psychologist->documents()->exists()) {
                throw new ApiException(409, 'O cadastro precisa de documento comprobatório.');
            }

            $psychologist->update([
                'approval_status' => $decision,
                'approval_note' => $decision === 'rejected' ? $reason : null,
                'approved_by_user_id' => $admin->id,
                'approval_decided_at' => now(),
                'profile_published_at' => null,
            ]);

            $psychologist->user->notifications()->create([
                'type' => $decision === 'approved' ? 'psychologist_registration_approved' : 'psychologist_registration_rejected',
                'resource_id' => $psychologist->id,
            ]);

            return $psychologist;
        });
    }

    public function document(User $user, int $id): PsychologistDocument
    {
        $document = PsychologistDocument::with('psychologist')->findOrFail($id);

        if ($user->role !== 'admin' && $document->psychologist->user_id !== $user->id) {
            abort(404);
        }

        return $document;
    }

    private function approvedProfile(User $user): Psychologist
    {
        $psychologist = $user->psychologist;

        if (! $psychologist || $psychologist->approval_status !== 'approved') {
            abort(403);
        }

        return $psychologist;
    }
}
