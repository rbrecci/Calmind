<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListPatientDirectoryRequest;
use App\Http\Requests\StoreGuardianConsentRequest;
use App\Http\Resources\GuardianConsentResource;
use App\Services\GuardianConsentService;
use Illuminate\Http\JsonResponse;

class GuardianConsentController extends Controller
{
    public function __construct(private GuardianConsentService $consents) {}

    public function index(ListPatientDirectoryRequest $request, int $id): JsonResponse
    {
        $consents = $this->consents->paginate($request->user(), $id, (int) $request->validated('page', 1), (int) $request->validated('per_page', 20));

        return response()->json([
            'data' => $consents->getCollection()->map(fn ($consent) => (new GuardianConsentResource($consent))->toArray($request))->all(),
            'meta' => ['total' => $consents->total(), 'page' => $consents->currentPage(), 'per_page' => $consents->perPage()],
        ]);
    }

    public function store(StoreGuardianConsentRequest $request, int $id): JsonResponse
    {
        return response()->json((new GuardianConsentResource($this->consents->create($request->user(), $id, $request->validated())))->toArray($request), 201);
    }
}
