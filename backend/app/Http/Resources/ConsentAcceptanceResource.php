<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConsentAcceptanceResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $this->id,
            'consent_term_id' => $this->consent_term_id,
            'type' => $this->consentTerm->type,
            'version' => $this->consentTerm->version,
            'accepted_at' => $attributes['accepted_at'],
            'revoked_at' => $attributes['revoked_at'] ?? null,
        ];
    }
}
