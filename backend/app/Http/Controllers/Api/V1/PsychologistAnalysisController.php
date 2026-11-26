<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AnalysisBodyRequest;
use App\Http\Requests\ListMedicationsRequest;
use App\Http\Requests\RequestAnalysisRequest;
use App\Http\Resources\AnalysisResource;
use App\Services\AnalysisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PsychologistAnalysisController extends Controller
{
    public function __construct(private AnalysisService $analyses) {}

    // RF-41: unico ponto que aciona a IA, e so por pedido explicito do psicologo
    public function store(RequestAnalysisRequest $request): JsonResponse
    {
        return (new AnalysisResource($this->analyses->request($request->user(), $request->validated())))
            ->response()->setStatusCode(201);
    }

    public function index(ListMedicationsRequest $request): JsonResponse
    {
        $bondId = $request->validated('bond_id');
        $page = $this->analyses->list(
            $request->user(), $bondId === null ? null : (int) $bondId,
            (int) $request->validated('page', 1), (int) $request->validated('per_page', 20),
        );

        return response()->json([
            'data' => $page->getCollection()->map(fn ($analysis) => (new AnalysisResource($analysis))->toArray($request))->all(),
            'meta' => ['total' => $page->total(), 'page' => $page->currentPage(), 'per_page' => $page->perPage()],
        ]);
    }

    public function show(Request $request, int $id): AnalysisResource
    {
        return new AnalysisResource($this->analyses->find($request->user(), $id));
    }

    public function confirm(AnalysisBodyRequest $request, int $id): AnalysisResource
    {
        return new AnalysisResource($this->analyses->confirm($request->user(), $id, $request->validated('body')));
    }

    public function discard(Request $request, int $id): JsonResponse
    {
        $this->analyses->discard($request->user(), $id);

        return response()->json(['message' => 'Sugestão descartada. Nada foi guardado.']);
    }

    public function update(AnalysisBodyRequest $request, int $id): AnalysisResource
    {
        return new AnalysisResource($this->analyses->edit($request->user(), $id, $request->validated('body')));
    }
}
