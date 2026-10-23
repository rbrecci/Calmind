<?php

namespace App\Models;

use App\Models\Concerns\SerializesContractDates;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

// Nao estende BaseModel porque precisa de Authenticatable; usa a mesma trait de data (DA-06)
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, SerializesContractDates;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'email',
        'password_hash',
        'role',
        'status',
        'suspended_at',
    ];

    // RNF-07: a senha nunca sai em resposta
    protected $hidden = [
        'password_hash',
    ];

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    protected function casts(): array
    {
        return [
            'password_hash' => 'hashed',
            'suspended_at' => 'datetime',
        ];
    }

    public function patient(): HasOne
    {
        return $this->hasOne(Patient::class);
    }

    public function psychologist(): HasOne
    {
        return $this->hasOne(Psychologist::class);
    }

    public function consentAcceptances(): HasMany
    {
        return $this->hasMany(ConsentAcceptance::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function notificationPreferences(): HasMany
    {
        return $this->hasMany(NotificationPreference::class);
    }
}
