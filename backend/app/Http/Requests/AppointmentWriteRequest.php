<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AppointmentWriteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $creating = $this->isMethod('post');

        return [
            'bond_id' => $creating ? ['required', 'integer', 'min:1'] : ['prohibited'],
            'scheduled_at' => [$creating ? 'required' : 'sometimes', 'date', 'regex:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?[+-]\d{2}:\d{2}$/', 'after_or_equal:now'],
            'modality' => ['sometimes', 'nullable', 'in:online,presencial'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:255'],
            'confirm_conflict' => ['sometimes', 'boolean'],
            'status' => ['prohibited'],
            'created_by_user_id' => ['prohibited'],
        ];
    }
}
