<?php

namespace App\Http\Resources;

use App\Models\Invitation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Invitation */
class InvitationResource extends JsonResource
{
    public static $wrap = null;

    // RF-06: o psicologo precisa ver o codigo e a data de expiracao no momento da geracao
    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $attributes['id'],
            'code' => $attributes['code'],
            'expires_at' => $attributes['expires_at'],
            'created_at' => $attributes['created_at'],
        ];
    }
}
