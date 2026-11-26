<?php

namespace App\Http\Resources;

use App\Models\Analysis;
use App\Services\AnalysisService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Analysis */
class AnalysisResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $attributes = $this->resource->attributesToArray();
        $versions = $this->versions->sortBy('id')->values();

        return [
            'id' => $attributes['id'],
            'bond_id' => $attributes['bond_id'],
            'period_start' => $attributes['period_start'],
            'period_end' => $attributes['period_end'],
            // generated = sugestao ainda nao revisada; confirmed = incorporada ao prontuario
            'status' => $attributes['status'],
            'origin' => 'ai_suggestion',
            'label' => AnalysisService::LABEL,
            // generated: o texto sugerido; confirmed: a versao mais recente
            'summary' => $attributes['status'] === 'confirmed' ? $versions->last()?->body : ($attributes['summary_raw'] ?? null),
            'requested_at' => $attributes['requested_at'] ?? null,
            'confirmed_at' => $attributes['confirmed_at'] ?? null,
            'confirmed_by_user_id' => $versions->first()?->edited_by_user_id,
            'versions' => $versions->map(fn ($version) => [
                'id' => $version->id,
                'body' => $version->body,
                'edited_at' => $version->edited_at?->toIso8601String(),
                'edited_by_user_id' => $version->edited_by_user_id,
            ])->all(),
        ];
    }
}
