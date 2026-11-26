<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RequestAnalysisRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bond_id' => ['required', 'integer', 'min:1'],
            'period_start' => ['required', 'date_format:Y-m-d'],
            'period_end' => ['required', 'date_format:Y-m-d', 'after_or_equal:period_start', 'before_or_equal:today'],
        ];
    }
}
