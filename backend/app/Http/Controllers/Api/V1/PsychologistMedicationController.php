<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListMedicationsRequest;
use App\Http\Requests\MedicationWriteRequest;
use App\Http\Resources\MedicationResource;
use App\Services\MedicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PsychologistMedicationController extends Controller
{
    public function __construct(private MedicationService $medications) {}

    public function index(ListMedicationsRequest $request): JsonResponse
    {
        $bondId = $request->validated('bond_id');
        $page = $this->medications->psychologistList(
            $request->user(), $bondId === null ? null : (int) $bondId,
            (int) $request->validated('page', 1), (int) $request->validated('per_page', 20),
        );

        return response()->json([
            'data' => $page->getCollection()->map(fn ($medication) => (new MedicationResource($medication))->toArray($request))->all(),
            'meta' => ['total' => $page->total(), 'page' => $page->currentPage(), 'per_page' => $page->perPage()],
        ]);
    }

    public function store(MedicationWriteRequest $request): JsonResponse
    {
        return (new MedicationResource($this->medications->create($request->user(), $request->validated())))
            ->response()->setStatusCode(201);
    }

    public function show(Request $request, int $id): MedicationResource
    {
        return new MedicationResource($this->medications->psychologistFind($request->user(), $id));
    }

    public function reactivate(Request $request, int $id): never
    {
        $this->medications->reactivate($request->user(), $id);
    }
}
