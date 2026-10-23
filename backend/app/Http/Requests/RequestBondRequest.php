<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RequestBondRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // A existencia e a disponibilidade do profissional sao checadas no BondService, com mensagem unica
        return [
            'psychologist_id' => ['required', 'integer', 'min:1'],
        ];
    }
}
