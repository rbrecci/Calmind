<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalysisVersion extends BaseModel
{
    protected $table = 'analysis_versions';

    public $timestamps = false;

    protected $fillable = [
        'analysis_id',
        'body',
        'edited_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'edited_at' => 'datetime',
        ];
    }

    public function analysis(): BelongsTo
    {
        return $this->belongsTo(Analysis::class);
    }

    public function editedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'edited_by_user_id');
    }
}
