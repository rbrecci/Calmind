<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Medication extends BaseModel
{
    protected $table = 'medications';

    const UPDATED_AT = null;

    protected $fillable = [
        'bond_id',
        'name',
        'dosage',
        'prescription_source',
        'status',
        'registered_by_user_id',
        'confirmed_at',
        'refused_at',
        'refusal_reason',
        'suspended_at',
        'suspended_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'confirmed_at' => 'datetime',
            'refused_at' => 'datetime',
            'suspended_at' => 'datetime',
        ];
    }

    public function bond(): BelongsTo
    {
        return $this->belongsTo(Bond::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by_user_id');
    }

    public function suspendedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'suspended_by_user_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(MedicationSchedule::class);
    }

    public function intakes(): HasMany
    {
        return $this->hasMany(MedicationIntake::class);
    }
}
