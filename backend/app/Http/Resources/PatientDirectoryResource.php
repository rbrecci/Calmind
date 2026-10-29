<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientDirectoryResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();
        $active = $this->status === 'active';

        return [
            'bond_id' => $this->id,
            'status' => $this->status,
            'since' => $attributes['responded_at'] ?? null,
            'ended_at' => $attributes['ended_at'] ?? null,
            'patient' => ['id' => $this->patient->user_id, 'name' => $this->patient->user->name],
            'unread_messages' => $active ? (int) $this->unread_messages : 0,
            'overdue_tasks' => $active ? (int) $this->overdue_tasks : 0,
            'next_appointment_at' => $active && $this->next_appointment_at !== null
                ? Carbon::parse($this->next_appointment_at, config('app.timezone'))->toIso8601String() : null,
        ];
    }
}
