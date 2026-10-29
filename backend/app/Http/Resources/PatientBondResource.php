<?php

namespace App\Http\Resources;

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
            'ended_at' => $attributes['ended_at'] ?? null,
            'psychologist' => [
                'id' => $this->psychologist->id,
                'name' => $this->psychologist->user->name,
                'crp' => $this->psychologist->crp_region.'/'.$this->psychologist->crp_number,
            ],
            'unread_messages' => (int) $this->unread_messages,
        ];
    }
}
