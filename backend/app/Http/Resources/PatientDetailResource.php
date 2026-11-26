<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientDetailResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $minor = $this->patient->birth_date->age < 18;

        return [
            'bond_id' => $this->id,
            'bond_status' => $this->status,
            'since' => $this->resource->attributesToArray()['responded_at'] ?? null,
            'patient' => [
                'id' => $this->patient->user_id,
                'name' => $this->patient->user->name,
                'avatar_url' => User::profileImageUrl($this->patient->user_id, 'avatar', $this->patient->user->avatar_path),
                'cover_url' => User::profileImageUrl($this->patient->user_id, 'cover', $this->patient->user->cover_path),
            ],
            'is_minor' => $minor,
            'guardian' => $minor ? [
                'name' => $this->patient->guardian_name,
                'phone' => $this->patient->guardian_phone,
                'relationship' => $this->patient->guardian_relationship,
            ] : null,
        ];
    }
}
