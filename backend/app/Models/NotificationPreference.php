<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Chave composta (user_id, type): nao ha coluna id
class NotificationPreference extends BaseModel
{
    protected $table = 'notification_preferences';

    protected $primaryKey = null;

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'type',
        'enabled',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
        ];
    }

    // Sem id, o UPDATE do Eloquent nao teria WHERE: aponta para as duas colunas da chave
    protected function setKeysForSaveQuery($query): Builder
    {
        return $query
            ->where('user_id', $this->getOriginal('user_id'))
            ->where('type', $this->getOriginal('type'));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
