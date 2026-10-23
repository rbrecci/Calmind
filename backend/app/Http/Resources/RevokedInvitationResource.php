<?php

namespace App\Http\Resources;

use App\Models\Invitation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Invitation */
class RevokedInvitationResource extends JsonResource
{
    public static $wrap = null;

    // RF-08: formato proprio do contrato da revogacao (revoked_at no lugar de created_at)
    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $attributes['id'],
            'code' => $attributes['code'],
            'expires_at' => $attributes['expires_at'],
            'revoked_at' => $attributes['revoked_at'],
        ];
    }
}
