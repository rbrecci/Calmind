<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends BaseModel
{
    protected $table = 'patients';

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'birth_date',
        'phone',
        'guardian_name',
        'guardian_phone',
        'guardian_relationship',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bonds(): HasMany
    {
        return $this->hasMany(Bond::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function guardianConsents(): HasMany
    {
        return $this->hasMany(GuardianConsent::class);
    }
}
