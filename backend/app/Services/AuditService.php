<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditService
{
    // RNF-04, CA-17.3: somente insercao. De proposito nao existe metodo que altere ou apague linha da trilha.
    // Tentativa negada tambem entra (CA-05.2, CA-23.5), por isso `result` e parametro.
    public function record(
        ?int $actorUserId,
        string $action,
        string $resourceType,
        string $result,
        ?int $resourceId = null,
        ?int $targetPatientId = null,
    ): void {
        AuditLog::create([
            'actor_user_id' => $actorUserId,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'target_patient_id' => $targetPatientId,
            'result' => $result,
        ]);
    }
}
