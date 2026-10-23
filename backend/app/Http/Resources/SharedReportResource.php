<?php

namespace App\Http\Resources;

use App\Models\SharedReport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// RNF-08, CA-23.1: o psicologo recebe id, texto e data, e nada mais. Nenhuma chave que sugira
// que existem relatos que ele nao ve (visibilidade, despublicacao, contagem).
/** @mixin SharedReport */
class SharedReportResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        // attributesToArray decifra o body (RNF-02) e aplica serializeDate (DA-06)
        $attributes = $this->resource->attributesToArray();

        return [
            'id' => $attributes['id'],
            'body' => $attributes['body'],
            'created_at' => $attributes['created_at'],
        ];
    }
}
