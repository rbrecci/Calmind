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
        'avatar_path',
        'cover_path',
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

    // URL absoluta com o APP_URL do .env. O ?v= muda a cada envio (o nome do arquivo e novo), entao o
    // cache de imagem do app percebe a troca. Estatico porque o catalogo traz o caminho pelo join, sem User
    public static function profileImageUrl(int $userId, string $kind, ?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        return rtrim(config('app.url'), '/').route('users.profile-image', [
            'id' => $userId,
            'kind' => $kind,
            'v' => substr(sha1($path), 0, 12),
        ], false);
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
