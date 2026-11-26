<?php

namespace App\Http\Resources;

use App\Models\Medication;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Medication */
class MedicationResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $attributes['id'],
            'bond_id' => $attributes['bond_id'],
            'name' => $attributes['name'],
            'dosage' => $attributes['dosage'] ?? null,
            'prescription_source' => $attributes['prescription_source'],
            'status' => $attributes['status'],
            'schedules' => $this->schedules->map(fn ($schedule) => [
                'weekday' => $schedule->weekday,
                'time_of_day' => substr((string) $schedule->time_of_day, 0, 5),
            ])->sortBy(fn ($slot) => $slot['weekday'].$slot['time_of_day'])->values()->all(),
            'confirmed_at' => $attributes['confirmed_at'] ?? null,
            'refused_at' => $attributes['refused_at'] ?? null,
            'refusal_reason' => $attributes['refusal_reason'] ?? null,
            'suspended_at' => $attributes['suspended_at'] ?? null,
            // CA-29.2: a suspensao e informacao clinica e mostra que partiu do paciente
            'suspended_by' => ($attributes['suspended_by_user_id'] ?? null) === null ? null : 'patient',
            'created_at' => $attributes['created_at'] ?? null,
            // CA-29.4 e CA-38.3: o aviso acompanha toda resposta de medicacao
            'notice' => 'A plataforma não prescreve nem altera prescrição médica.',
        ];
    }
}
