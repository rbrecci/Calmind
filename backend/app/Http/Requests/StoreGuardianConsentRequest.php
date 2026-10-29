<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGuardianConsentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guardian_name' => ['required', 'string', 'max:150'],
            'obtained_at' => ['required', 'date_format:Y-m-d', 'before_or_equal:today'],
            'method' => ['required', 'in:presencial,telefone,videochamada,mensagem_escrita'],
            'note' => ['nullable', 'string'],
        ];
    }
}
