<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePsychologistProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'psychologist';
    }

    public function rules(): array
    {
        return [
            'profile_approach' => ['sometimes', 'nullable', 'string', 'max:120'],
            'profile_specialty' => ['sometimes', 'nullable', 'string', 'max:120'],
            'profile_modality' => ['sometimes', 'nullable', Rule::in(['online', 'presencial', 'ambos'])],
            'profile_region' => ['sometimes', 'nullable', 'string', 'max:120'],
            'profile_bio' => ['sometimes', 'nullable', 'string', 'max:3000'],
        ];
    }
}
