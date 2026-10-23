<?php

namespace App\Http\Resources;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Task */
class TaskResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $attributes['id'],
            'bond_id' => $attributes['bond_id'],
            'title' => $attributes['title'],
            'description' => $attributes['description'],
            'due_date' => $attributes['due_date'],
            'status' => $this->completed_at === null ? 'pending' : 'completed',
            'completed_at' => $attributes['completed_at'] ?? null,
            'created_at' => $attributes['created_at'],
        ];
    }
}
