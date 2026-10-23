<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    // RF-22, DEC-13: visibility e opcional e o padrao (compartilhado) e decidido no Service
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:10000'],
            'visibility' => ['nullable', 'in:shared,private'],
        ];
    }
}
