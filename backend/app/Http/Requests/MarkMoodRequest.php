<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkMoodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['mood' => ['required', 'in:bad,neutral,good']];
    }
}
