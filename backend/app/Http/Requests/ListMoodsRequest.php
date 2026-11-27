<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Um mes de calendario cabe na pagina padrao
class ListMoodsRequest extends FormRequest
{
    public const DEFAULT_PER_PAGE = 31;

    public const MAX_PER_PAGE = 100;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.self::MAX_PER_PAGE],
        ];
    }

    public function perPage(): int
    {
        return (int) ($this->validated('per_page') ?? self::DEFAULT_PER_PAGE);
    }

    public function page(): int
    {
        return (int) ($this->validated('page') ?? 1);
    }
}
