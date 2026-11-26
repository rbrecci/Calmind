<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListMedicationsRequest;
use App\Http\Requests\MarkMedicationIntakeRequest;
use App\Http\Requests\MedicationDosesRequest;
use App\Http\Requests\RefuseMedicationRequest;
use App\Http\Resources\MedicationResource;
use App\Services\MedicationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientMedicationController extends Controller
{
    public function __construct(private MedicationService $medications) {}

    public function index(ListMedicationsRequest $request): JsonResponse
    {
        $page = $this->medications->patientList(
            $request->user(), (int) $request->validated('page', 1), (int) $request->validated('per_page', 20),
        );

        return response()->json([
            'data' => $page->getCollection()->map(fn ($medication) => (new MedicationResource($medication))->toArray($request))->all(),
            'meta' => ['total' => $page->total(), 'page' => $page->currentPage(), 'per_page' => $page->perPage()],
        ]);
    }

    public function show(Request $request, int $id): MedicationResource
    {
        return new MedicationResource($this->medications->patientFind($request->user(), $id));
    }

    public function confirm(Request $request, int $id): MedicationResource
    {
        return new MedicationResource($this->medications->confirm($request->user(), $id));
    }

    public function refuse(RefuseMedicationRequest $request, int $id): MedicationResource
    {
        return new MedicationResource($this->medications->refuse($request->user(), $id, $request->validated('reason')));
    }

    public function suspend(Request $request, int $id): MedicationResource
    {
        return new MedicationResource($this->medications->suspend($request->user(), $id));
    }

    // horarios previstos do periodo (padrao: de hoje a 7 dias) com a marcacao de cada um
    public function doses(MedicationDosesRequest $request): JsonResponse
    {
        $from = Carbon::parse($request->validated('from', today()->toDateString()))->startOfDay();
        $to = Carbon::parse($request->validated('to', today()->addDays(6)->toDateString()))->endOfDay();

        return response()->json(['data' => $this->medications->patientDoses($request->user(), $from, $to)->all()]);
    }

    public function markTaken(MarkMedicationIntakeRequest $request, int $id): JsonResponse
    {
        $intake = $this->medications->markTaken($request->user(), $id, Carbon::parse($request->validated('scheduled_for')));

        return response()->json([
            'medication_id' => $intake->medication_id,
            'scheduled_for' => $intake->scheduled_for->toIso8601String(),
            'marked_at' => $intake->marked_at->toIso8601String(),
        ]);
    }
}
