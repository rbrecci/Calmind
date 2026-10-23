<?php

namespace App\Http\Resources;

use App\Models\Psychologist;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Psychologist */
class CatalogPsychologistResource extends JsonResource
{
    // RNF-21, RNF-23, CA-09.3: lista fechada de campos. Nada de preco, nota ou ranking aqui, nem por engano
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // name vem do join com users feito no BondService::catalog
            'name' => $this->name,
            // RNF-22: nome completo e registro sempre visiveis
            'crp' => $this->crp_region.'/'.$this->crp_number,
            'approach' => $this->profile_approach,
            'specialty' => $this->profile_specialty,
            'modality' => $this->profile_modality,
            'region' => $this->profile_region,
            'bio' => $this->profile_bio,
        ];
    }
}
