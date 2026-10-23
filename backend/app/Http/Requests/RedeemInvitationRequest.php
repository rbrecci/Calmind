<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RedeemInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Sem regra de formato ou tamanho exato: um codigo mal formado tem que dar o mesmo 422
        // de um codigo inexistente (CA-07.2) e contar como tentativa (RNF-06). O max so limita o abuso.
        return [
            'code' => ['required', 'string', 'max:64'],
        ];
    }
}
