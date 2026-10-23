<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class AuditLog extends BaseModel
{
    protected $table = 'audit_logs';

    public $timestamps = false;

    // CA-17.3: somente insercao. A aplicacao nunca altera nem apaga linha daqui
    protected $fillable = [
        'actor_user_id',
        'action',
        'resource_type',
        'resource_id',
        'target_patient_id',
        'result',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
        ];
    }

    // Linha ja gravada nao muda: bloquear save de registro existente cobre update e push
    public function save(array $options = []): bool
    {
        if ($this->exists) {
            throw new LogicException('audit_logs e somente de insercao.');
        }

        return parent::save($options);
    }

    public function delete(): never
    {
        throw new LogicException('audit_logs e somente de insercao.');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    public function targetPatient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'target_patient_id');
    }
}
