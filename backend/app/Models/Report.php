<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Report extends BaseModel
{
    protected $table = 'reports';

    const UPDATED_AT = null;

    // RNF-02: body cifrado em repouso. Rota de psicologo e de admin nao le esta Model, le SharedReport (RNF-08)
    protected $fillable = [
        'bond_id',
        'patient_id',
        'body',
        'visibility',
        'unpublished_at',
    ];

    protected function casts(): array
    {
        return [
            'body' => 'encrypted',
            'unpublished_at' => 'datetime',
        ];
    }

    public function bond(): BelongsTo
    {
        return $this->belongsTo(Bond::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function analyses(): BelongsToMany
    {
        return $this->belongsToMany(Analysis::class, 'analysis_reports');
    }
}
