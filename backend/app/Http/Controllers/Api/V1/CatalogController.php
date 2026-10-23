<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CatalogIndexRequest;
use App\Http\Resources\CatalogPsychologistCollection;
use App\Services\BondService;

class CatalogController extends Controller
{
    public function __construct(private BondService $bonds) {}

    public function index(CatalogIndexRequest $request): CatalogPsychologistCollection
    {
        $perPage = (int) ($request->validated('per_page') ?? BondService::DEFAULT_PER_PAGE);

        return new CatalogPsychologistCollection(
            $this->bonds->catalog($request->user(), $request->validated(), $perPage)
        );
    }
}
