<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Confirmar aceita um texto editado (opcional); editar depois de confirmado exige o texto
class AnalysisBodyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('put');

        return ['body' => [$required ? 'required' : 'sometimes', 'string', 'min:1', 'max:20000']];
    }
}
