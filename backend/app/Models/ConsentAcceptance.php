<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsentAcceptance extends BaseModel
{
    protected $table = 'consent_acceptances';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'consent_term_id',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function consentTerm(): BelongsTo
    {
        return $this->belongsTo(ConsentTerm::class);
    }
}
