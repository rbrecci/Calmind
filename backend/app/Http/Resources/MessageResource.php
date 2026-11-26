<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $this->id,
            'bond_id' => $this->bond_id,
            'sender_user_id' => $this->sender_user_id,
            'mine' => $this->sender_user_id === $request->user()->id,
            'body' => $this->body,
            'sent_at' => $attributes['sent_at'],
            'read_at' => $attributes['read_at'] ?? null,
        ];
    }
}
