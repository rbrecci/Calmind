<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

abstract class ApiCollection extends ResourceCollection
{
    // DA-07: o contrato manda. meta e exatamente {total, page, per_page}, sem links nem path
    public function paginationInformation($request, $paginated, $default): array
    {
        return [
            'meta' => [
                'total' => $paginated['total'],
                'page' => $paginated['current_page'],
                'per_page' => $paginated['per_page'],
            ],
        ];
    }
}
