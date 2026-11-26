<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientBondResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $this->id,
            'status' => $this->status,
            'origin' => $this->origin,
            'requested_at' => $attributes['requested_at'],
            'responded_at' => $attributes['responded_at'] ?? null,
            'accepted_at' => $attributes['accepted_at'] ?? null,
            'ended_at' => $attributes['ended_at'] ?? null,
            'psychologist' => [
                'id' => $this->psychologist->id,
                'name' => $this->psychologist->user->name,
                'crp' => $this->psychologist->crp_region.'/'.$this->psychologist->crp_number,
                // Mesmos campos do CatalogPsychologistResource: com vinculo ativo o catalogo responde 403
                'approach' => $this->psychologist->profile_approach,
                'specialty' => $this->psychologist->profile_specialty,
                'modality' => $this->psychologist->profile_modality,
                'region' => $this->psychologist->profile_region,
                'bio' => $this->psychologist->profile_bio,
                'avatar_url' => User::profileImageUrl($this->psychologist->user_id, 'avatar', $this->psychologist->user->avatar_path),
                'cover_url' => User::profileImageUrl($this->psychologist->user_id, 'cover', $this->psychologist->user->cover_path),
            ],
            'unread_messages' => (int) $this->unread_messages,
        ];
    }
}
