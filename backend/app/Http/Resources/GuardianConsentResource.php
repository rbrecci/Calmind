<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GuardianConsentResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $this->id,
            'guardian_name' => $this->guardian_name,
            'obtained_at' => $attributes['obtained_at'],
            'method' => $this->method,
            'note' => $this->note,
            'consent_term_id' => $this->consent_term_id,
            'registered_by_user_id' => $this->registered_by_user_id,
            'created_at' => $attributes['created_at'],
        ];
    }
}
