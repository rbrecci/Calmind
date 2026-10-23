<?php

namespace App\Models\Concerns;

use Carbon\Carbon;
use DateTimeInterface;

trait SerializesContractDates
{
    // DA-06: o contrato manda. ISO 8601 com offset do fuso da aplicacao, nunca UTC com Z
    protected function serializeDate(DateTimeInterface $date): string
    {
        return Carbon::instance($date)
            ->setTimezone(config('app.timezone'))
            ->toIso8601String();
    }
}
