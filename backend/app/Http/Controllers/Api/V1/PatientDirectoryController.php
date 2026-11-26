<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListPatientDirectoryRequest;
use App\Http\Resources\BondRequestResource;
use App\Http\Resources\PatientBondResource;
use App\Http\Resources\PatientDetailResource;
use App\Http\Resources\PatientDirectoryResource;
use App\Services\PatientDirectoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientDirectoryController extends Controller
{
    public function __construct(private PatientDirectoryService $directory) {}

    public function profile(Request $request): JsonResponse
    {
        return response()->json($this->directory->profile($request->user()));
    }

    public function bonds(ListPatientDirectoryRequest $request): JsonResponse
    {
        $bonds = $this->directory->bonds($request->user(), (int) $request->validated('page', 1), (int) $request->validated('per_page', 20));

        return response()->json([
            'data' => $bonds->getCollection()->map(fn ($bond) => (new PatientBondResource($bond))->toArray($request))->all(),
            'meta' => ['total' => $bonds->total(), 'page' => $bonds->currentPage(), 'per_page' => $bonds->perPage()],
        ]);
    }

    public function requests(ListPatientDirectoryRequest $request): JsonResponse
    {
        $bonds = $this->directory->requests($request->user(), (int) $request->validated('page', 1), (int) $request->validated('per_page', 20));

        return response()->json([
            'data' => $bonds->getCollection()->map(fn ($bond) => (new BondRequestResource($bond))->toArray($request))->all(),
            'meta' => ['total' => $bonds->total(), 'page' => $bonds->currentPage(), 'per_page' => $bonds->perPage()],
        ]);
    }

    public function index(ListPatientDirectoryRequest $request): JsonResponse
    {
        $bonds = $this->directory->patients($request->user(), $request->validated('status', 'active'), (int) $request->validated('page', 1), (int) $request->validated('per_page', 20));

        return response()->json([
            'data' => $bonds->getCollection()->map(fn ($bond) => (new PatientDirectoryResource($bond))->toArray($request))->all(),
            'meta' => ['total' => $bonds->total(), 'page' => $bonds->currentPage(), 'per_page' => $bonds->perPage()],
        ]);
    }

    public function show(Request $request, int $id): PatientDetailResource
    {
        return new PatientDetailResource($this->directory->patient($request->user(), $id));
    }
}
