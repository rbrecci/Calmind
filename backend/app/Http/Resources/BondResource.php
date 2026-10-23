<?php

namespace App\Http\Resources;

use App\Models\Bond;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Bond */
class BondResource extends JsonResource
{
    // Recurso unico plano: a colecao do Postman le b.id e b.status direto, sem "data"
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        // attributesToArray aplica serializeDate (DA-06)
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $attributes['id'],
            'status' => $attributes['status'],
            'origin' => $attributes['origin'],
            // psychologists.id, nao users.id
            'psychologist_id' => $attributes['psychologist_id'],
            // O resto da API identifica paciente por users.id
            'patient_user_id' => $this->resource->patient->user_id,
            'requested_at' => $attributes['requested_at'],
            'responded_at' => $attributes['responded_at'] ?? null,
            'ended_at' => $attributes['ended_at'] ?? null,
        ];
    }
}
