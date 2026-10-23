<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends BaseModel
{
    protected $table = 'appointments';

    protected $fillable = [
        'bond_id',
        'scheduled_at',
        'status',
        'modality',
        'notes',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
        ];
    }

    public function bond(): BelongsTo
    {
        return $this->belongsTo(Bond::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
