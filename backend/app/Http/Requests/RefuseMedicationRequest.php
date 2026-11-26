<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// RF-27, CA-27.4: recusar sem motivo nao grava
class RefuseMedicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['reason' => ['required', 'string', 'min:1', 'max:2000']];
    }
}
