<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Complaint extends BaseModel
{
    protected $table = 'complaints';

    const UPDATED_AT = null;

    protected $fillable = [
        'reporter_user_id',
        'reported_user_id',
        'reason',
        'description',
        'status',
        'decision',
        'decided_by_user_id',
        'decided_at',
    ];

    protected function casts(): array
    {
        return [
            'decided_at' => 'datetime',
        ];
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_user_id');
    }

    public function reported(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }

    public function decidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by_user_id');
    }
}
