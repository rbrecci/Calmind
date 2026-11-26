<?php

namespace App\Services\Ai;

// GEMINI_API_KEY (a primeira) + GEMINI_API_KEYS (lista separada por virgula), sem vazios nem repetidas
final class KeyList
{
    /** @return list<string> */
    public static function merge(?string $single, ?string $list): array
    {
        return array_values(array_unique(array_filter(array_map('trim', array_merge([(string) $single], explode(',', (string) $list))))));
    }
}
