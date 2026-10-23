<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConsentTerm extends BaseModel
{
    protected $table = 'consent_terms';

    const UPDATED_AT = null;

    protected $fillable = [
        'type',
        'version',
        'body',
        'effective_from',
        'published_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'effective_from' => 'datetime',
        ];
    }

    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by_user_id');
    }

    public function acceptances(): HasMany
    {
        return $this->hasMany(ConsentAcceptance::class);
    }
}
