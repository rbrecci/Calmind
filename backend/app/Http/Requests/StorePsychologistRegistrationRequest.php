<?php

namespace App\Http\Requests;

use App\Models\Psychologist;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePsychologistRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'psychologist';
    }

    public function rules(): array
    {
        $existingId = Psychologist::where('user_id', $this->user()->id)->value('id');

        return [
            'crp_region' => ['required', 'string', Rule::in(array_map(fn (int $region) => sprintf('%02d', $region), range(1, 24)))],
            'crp_number' => [
                'required',
                'string',
                'regex:/^[0-9]{4,7}$/',
                Rule::unique('psychologists', 'crp_number')
                    ->where('crp_region', $this->input('crp_region'))
                    ->ignore($existingId),
            ],
            'document' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'crp_region.in' => 'Informe uma região de CRP válida.',
            'crp_number.regex' => 'Informe o número de CRP com 4 a 7 dígitos.',
            'crp_number.unique' => 'Este registro profissional já foi cadastrado.',
        ];
    }
}
