<?php

namespace App\Http\Resources;

use App\Models\User;
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
        // O id de psychologist e o da tabela psychologists; a URL da imagem usa sempre o id do usuario
        $side = $request->user()->role === 'psychologist' ? 'patient' : 'psychologist';
        $person = $this->bond->{$side}->user;
        $data[$side] = [
            'id' => $side === 'patient' ? $person->id : $this->bond->psychologist_id,
            'name' => $person->name,
            'avatar_url' => User::profileImageUrl($person->id, 'avatar', $person->avatar_path),
            'cover_url' => User::profileImageUrl($person->id, 'cover', $person->cover_path),
        ];

        return $data;
    }
}
