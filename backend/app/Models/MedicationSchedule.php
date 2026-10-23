<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicationSchedule extends BaseModel
{
    protected $table = 'medication_schedules';

    public $timestamps = false;

    protected $fillable = [
        'medication_id',
        'weekday',
        'time_of_day',
    ];

    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
        ];
    }

    public function medication(): BelongsTo
    {
        return $this->belongsTo(Medication::class);
    }
}
