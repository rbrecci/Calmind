<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuardianConsent extends BaseModel
{
    protected $table = 'guardian_consents';

    const UPDATED_AT = null;

    // CA-49.3: append-only, a aplicacao so acrescenta registro
    protected $fillable = [
        'patient_id',
        'consent_term_id',
        'registered_by_user_id',
        'guardian_name',
        'obtained_at',
        'method',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'obtained_at' => 'date:Y-m-d',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function consentTerm(): BelongsTo
    {
        return $this->belongsTo(ConsentTerm::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by_user_id');
    }
}
