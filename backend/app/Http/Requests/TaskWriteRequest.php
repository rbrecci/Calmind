<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TaskWriteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $creating = $this->isMethod('post');

        return [
            'bond_id' => $creating ? ['required', 'integer', 'min:1'] : ['prohibited'],
            'title' => [$creating ? 'required' : 'sometimes', 'string', 'min:1', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'due_date' => [$creating ? 'required' : 'sometimes', 'date_format:Y-m-d', 'after_or_equal:today'],
            'completed_at' => ['prohibited'],
            'archived_at' => ['prohibited'],
        ];
    }
}
