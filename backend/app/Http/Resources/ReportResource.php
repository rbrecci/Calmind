<?php

namespace App\Http\Resources;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Visao do DONO do relato (paciente). O psicologo nunca recebe isto: ele recebe SharedReportResource.
/** @mixin Report */
class ReportResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        // attributesToArray decifra o body (RNF-02) e aplica serializeDate (DA-06)
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $attributes['id'],
            'body' => $attributes['body'],
            'visibility' => $attributes['visibility'],
            'unpublished_at' => $attributes['unpublished_at'] ?? null,
            'created_at' => $attributes['created_at'],
            // CA-24.2: vem do withExists do Service; o app avisa antes de o paciente confirmar a despublicacao
            'used_in_analysis' => (bool) ($attributes['used_in_analysis'] ?? false),
        ];
    }
}
