<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceContract extends BaseModel
{
    protected $table = 'service_contracts';

    public $timestamps = false;

    protected $fillable = [
        'version',
        'body',
        'effective_from',
    ];

    protected function casts(): array
    {
        return [
            'effective_from' => 'datetime',
        ];
    }

    public function acceptances(): HasMany
    {
        return $this->hasMany(ContractAcceptance::class);
    }
}
