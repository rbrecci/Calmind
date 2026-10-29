<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();
        $data = [
            'id' => $this->id,
            'bond_id' => $this->bond_id,
            'scheduled_at' => $attributes['scheduled_at'],
            'status' => $this->status,
            'modality' => $this->modality,
            'notes' => $this->notes,
            'created_at' => $attributes['created_at'],
        ];
        if ($request->user()->role === 'psychologist') {
            $data['patient'] = ['id' => $this->bond->patient->user_id, 'name' => $this->bond->patient->user->name];
        } else {
            $data['psychologist'] = ['id' => $this->bond->psychologist_id, 'name' => $this->bond->psychologist->user->name];
        }

        return $data;
    }
}
