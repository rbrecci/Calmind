<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Psychologist extends BaseModel
{
    protected $table = 'psychologists';

    protected $fillable = [
        'user_id',
        'crp_number',
        'crp_region',
        'approval_status',
        'approval_note',
        'approved_by_user_id',
        'approval_decided_at',
        'profile_approach',
        'profile_specialty',
        'profile_modality',
        'profile_region',
        'profile_bio',
        'profile_published_at',
    ];

    protected function casts(): array
    {
        return [
            'approval_decided_at' => 'datetime',
            'profile_published_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(PsychologistDocument::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    public function bonds(): HasMany
    {
        return $this->hasMany(Bond::class);
    }
}
