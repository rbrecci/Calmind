<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PsychologistDocument extends BaseModel
{
    protected $table = 'psychologist_documents';

    public $timestamps = false;

    protected $fillable = [
        'psychologist_id',
        'file_path',
        'original_name',
        'mime_type',
    ];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
        ];
    }

    public function psychologist(): BelongsTo
    {
        return $this->belongsTo(Psychologist::class);
    }
}
