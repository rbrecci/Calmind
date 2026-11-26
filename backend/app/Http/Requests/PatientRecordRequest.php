<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PatientRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // padrao: os ultimos 30 dias. O periodo maximo e 366 dias.
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:from'],
            'order' => ['sometimes', 'in:asc,desc'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $from = $this->input('from');
            $to = $this->input('to', now()->toDateString());
            if ($from && $to && now()->parse($from)->diffInDays(now()->parse($to)) > 366) {
                $validator->errors()->add('from', 'O período do prontuário pode ter no máximo 366 dias.');
            }
        });
    }
}
