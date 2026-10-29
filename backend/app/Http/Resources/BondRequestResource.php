<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BondRequestResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'origin' => $this->origin,
            'requested_at' => $this->resource->attributesToArray()['requested_at'],
            'patient' => ['id' => $this->patient->user_id, 'name' => $this->patient->user->name],
        ];
    }
}
