<?php

namespace App\Http\Requests;

use DateTimeImmutable;
use DateTimeZone;

// O formulario web tem data e hora separadas; a API recebe scheduled_at pronto. As regras de
// scheduled_at continuam as do AppointmentWriteRequest, herdadas (RNF-57).
class StoreAppointmentFormRequest extends AppointmentWriteRequest
{
    private const TIMEZONE = 'America/Sao_Paulo';

    private const TYPED_FORMAT = 'Y-m-d H:i';

    protected function prepareForValidation(): void
    {
        $this->merge(['scheduled_at' => $this->scheduledAtFromForm()]);
    }

    public function rules(): array
    {
        $rules = [
            'scheduled_date' => ['required', 'date_format:Y-m-d'],
            'scheduled_time' => ['required', 'date_format:H:i'],
            ...parent::rules(),
        ];

        // Sem data e hora validas o erro fica so no campo errado, sem um segundo erro em scheduled_at
        if ($this->input('scheduled_at') === null) {
            unset($rules['scheduled_at']);
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'scheduled_date.date_format' => 'Informe uma data válida.',
            'scheduled_time.date_format' => 'Informe uma hora válida.',
            'scheduled_at.after_or_equal' => 'Escolha uma data e hora a partir de agora.',
        ];
    }

    private function scheduledAtFromForm(): ?string
    {
        $date = $this->input('scheduled_date');
        $time = $this->input('scheduled_time');
        if (! is_string($date) || ! is_string($time)) {
            return null;
        }

        $typed = "{$date} {$time}";
        $local = DateTimeImmutable::createFromFormat('!'.self::TYPED_FORMAT, $typed, new DateTimeZone(self::TIMEZONE));

        // createFromFormat aceita 31/02 e devolve marco: a comparacao recusa esse transbordo
        return $local && $local->format(self::TYPED_FORMAT) === $typed ? $local->format(DATE_ATOM) : null;
    }
}
