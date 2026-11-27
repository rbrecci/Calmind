<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Humor do dia marcado pelo paciente. Nao e relato: nao tem texto nem privacidade propria,
// e o psicologo do vinculo ve (o app avisa o paciente antes de ele marcar).
class DailyMood extends BaseModel
{
    protected $table = 'daily_moods';

    protected $fillable = [
        'bond_id',
        'patient_id',
        'mood',
        'mood_date',
    ];

    protected function casts(): array
    {
        return ['mood_date' => 'date:Y-m-d'];
    }

    public function bond(): BelongsTo
    {
        return $this->belongsTo(Bond::class);
    }
}
