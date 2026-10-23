<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends BaseModel
{
    protected $table = 'notifications';

    const UPDATED_AT = null;

    // CA-16.1: carrega o tipo do evento, nunca conteudo clinico
    protected $fillable = [
        'user_id',
        'type',
        'resource_id',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
