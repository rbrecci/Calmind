<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Analysis extends BaseModel
{
    protected $table = 'analyses';

    public $timestamps = false;

    protected $fillable = [
        'bond_id',
        'requested_by_user_id',
        'period_start',
        'period_end',
        'status',
        'summary_raw',
        'confirmed_at',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date:Y-m-d',
            'period_end' => 'date:Y-m-d',
            'requested_at' => 'datetime',
            'confirmed_at' => 'datetime',
        ];
    }

    public function bond(): BelongsTo
    {
        return $this->belongsTo(Bond::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(AnalysisVersion::class);
    }

    public function reports(): BelongsToMany
    {
        return $this->belongsToMany(Report::class, 'analysis_reports');
    }
}
