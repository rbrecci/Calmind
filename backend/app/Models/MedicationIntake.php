<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicationIntake extends BaseModel
{
    protected $table = 'medication_intakes';

    public $timestamps = false;

    protected $fillable = [
        'medication_id',
        'scheduled_for',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_for' => 'datetime',
            'marked_at' => 'datetime',
        ];
    }

    public function medication(): BelongsTo
    {
        return $this->belongsTo(Medication::class);
    }
}
