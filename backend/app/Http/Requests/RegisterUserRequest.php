<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterUserRequest extends FormRequest
{
    // RF-01, DEC-16 e DEC-17
    private const MIN_AGE = 12;

    private const ADULT_AGE = 18;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => strtolower(trim($this->input('email')))]);
        }
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            // admin nunca nasce por cadastro publico
            'role' => ['required', Rule::in(['patient', 'psychologist'])],
        ];

        if ($this->input('role') !== 'patient') {
            return $rules;
        }

        $age = $this->age();
        $isMinor = $age !== null && $age >= self::MIN_AGE && $age < self::ADULT_AGE;

        // CA-01.5: menor de 18 exige os tres dados. Maior de idade: todos ou nenhum, como a CHECK ck_patients_guardian
        $guardian = fn (string $others) => $isMinor
            ? ['required', 'string']
            : ['nullable', 'string', 'required_with:'.$others];

        return $rules + [
            'phone' => ['nullable', 'string', 'max:20'],
            'birth_date' => [
                'bail',
                'required',
                'date_format:Y-m-d',
                'before:today',
                // CA-01.3: menor de 12 anos nao entra
                fn ($attribute, $value, $fail) => $this->age() >= self::MIN_AGE
                    || $fail('A idade mínima de uso da plataforma é '.self::MIN_AGE.' anos.'),
            ],
            'guardian_name' => [...$guardian('guardian_phone,guardian_relationship'), 'max:150'],
            'guardian_phone' => [...$guardian('guardian_name,guardian_relationship'), 'max:20'],
            'guardian_relationship' => [...$guardian('guardian_name,guardian_phone'), 'max:60'],
        ];
    }

    public function messages(): array
    {
        // CA-01.2: a mensagem nao confirma que existe conta com este e-mail
        $guardianTogether = 'Informe nome, telefone e parentesco do responsável, ou nenhum deles.';

        return [
            'email.unique' => 'Este e-mail não pode ser usado.',
            'guardian_name.required_with' => $guardianTogether,
            'guardian_phone.required_with' => $guardianTogether,
            'guardian_relationship.required_with' => $guardianTogether,
        ];
    }

    // Anos completos hoje, ou null se birth_date nao for uma data Y-m-d
    private function age(): ?int
    {
        $birthDate = $this->input('birth_date');

        if (! is_string($birthDate) || ! Carbon::canBeCreatedFromFormat($birthDate, '!Y-m-d')) {
            return null;
        }

        return (int) floor(Carbon::createFromFormat('!Y-m-d', $birthDate)->diffInYears(today()));
    }
}
