<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Bond extends BaseModel
{
    protected $table = 'bonds';

    public $timestamps = false;

    // active_patient_id e coluna gerada pelo banco (RF-12): fica fora do fillable
    protected $fillable = [
        'patient_id',
        'psychologist_id',
        'status',
        'origin',
        'invitation_id',
        'requested_at',
        'responded_at',
        'ended_at',
        'ended_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'requested_at' => 'datetime',
            'responded_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function psychologist(): BelongsTo
    {
        return $this->belongsTo(Psychologist::class);
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    public function endedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ended_by_user_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function medications(): HasMany
    {
        return $this->hasMany(Medication::class);
    }

    public function analyses(): HasMany
    {
        return $this->hasMany(Analysis::class);
    }

    public function contractAcceptances(): HasMany
    {
        return $this->hasMany(ContractAcceptance::class);
    }
}
