<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $attributes['id'],
            'type' => $attributes['type'],
            'resource_id' => $attributes['resource_id'],
            'created_at' => $attributes['created_at'],
            'read_at' => $attributes['read_at'] ?? null,
        ];
    }
}
