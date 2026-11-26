<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// RF-38: a origem da prescricao e obrigatoria (CA-38.2) e a plataforma nao prescreve (DEC-10)
class MedicationWriteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bond_id' => ['required', 'integer', 'min:1'],
            'name' => ['required', 'string', 'min:1', 'max:150'],
            'dosage' => ['sometimes', 'nullable', 'string', 'max:100'],
            'prescription_source' => ['required', 'string', 'min:1', 'max:200'],
            'schedules' => ['required', 'array', 'min:1', 'max:42'],
            'schedules.*.weekday' => ['required', 'integer', 'between:0,6'],
            'schedules.*.time_of_day' => ['required', 'date_format:H:i'],
            'status' => ['prohibited'],
        ];
    }
}
