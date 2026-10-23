<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    // O contrato de /me e plano: o app espera User {id, name, email, role} sem "data"
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        // attributesToArray aplica serializeDate (DA-06) e esconde password_hash (RNF-07)
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $attributes['id'],
            'name' => $attributes['name'],
            'email' => $attributes['email'],
            'role' => $attributes['role'],
            'created_at' => $attributes['created_at'],
        ];
    }
}
