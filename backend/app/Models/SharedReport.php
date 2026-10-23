<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

// RNF-08: toda leitura do lado do psicologo e do administrador passa por esta view,
// que ja filtra o relato privado e o despublicado. Nao filtre de novo aqui.
// Somente leitura: escrever relato e trabalho de Report. Bloquear save e delete cobre
// create, update, push, destroy e as versoes quietas, que passam por eles.
class SharedReport extends BaseModel
{
    protected $table = 'shared_reports';

    public $timestamps = false;

    protected $fillable = [];

    protected function casts(): array
    {
        return [
            // RNF-02: a view repassa o texto cifrado, o cast e que o decifra
            'body' => 'encrypted',
            'created_at' => 'datetime',
        ];
    }

    public function save(array $options = []): never
    {
        throw new LogicException('shared_reports e uma view somente leitura; grave por Report.');
    }

    public function delete(): never
    {
        throw new LogicException('shared_reports e uma view somente leitura; grave por Report.');
    }

    public function bond(): BelongsTo
    {
        return $this->belongsTo(Bond::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
