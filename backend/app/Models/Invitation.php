<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invitation extends BaseModel
{
    protected $table = 'invitations';

    const UPDATED_AT = null;

    protected $fillable = [
        'psychologist_id',
        'code',
        'expires_at',
        'consumed_at',
        'consumed_by_patient_id',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function psychologist(): BelongsTo
    {
        return $this->belongsTo(Psychologist::class);
    }

    public function consumedBy(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'consumed_by_patient_id');
    }
}
