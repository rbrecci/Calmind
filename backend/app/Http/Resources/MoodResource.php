<?php

namespace App\Http\Resources;

use App\Models\DailyMood;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DailyMood */
class MoodResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'date' => $this->mood_date->toDateString(),
            'mood' => $this->mood,
        ];
    }
}
