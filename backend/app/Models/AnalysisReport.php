<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Pivo com chave composta (analysis_id, report_id): nao ha coluna id
class AnalysisReport extends BaseModel
{
    protected $table = 'analysis_reports';

    protected $primaryKey = null;

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'analysis_id',
        'report_id',
    ];

    public function analysis(): BelongsTo
    {
        return $this->belongsTo(Analysis::class);
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }
}
