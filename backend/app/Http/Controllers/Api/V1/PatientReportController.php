<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListReportsRequest;
use App\Http\Requests\StoreReportRequest;
use App\Http\Requests\UpdateReportVisibilityRequest;
use App\Http\Resources\ReportCollection;
use App\Http\Resources\ReportResource;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function store(StoreReportRequest $request): JsonResponse
    {
        $report = $this->reports->create(
            $request->user(),
            $request->validated('body'),
            $request->validated('visibility') ?? ReportService::DEFAULT_VISIBILITY,
        );

        return (new ReportResource($report))->response()->setStatusCode(201);
    }

    public function index(ListReportsRequest $request): ReportCollection
    {
        return new ReportCollection($this->reports->paginate($request->user(), $request->perPage(), $request->page()));
    }

    public function update(UpdateReportVisibilityRequest $request, string $id): ReportResource
    {
        return new ReportResource($this->reports->changeVisibility($request->user(), (int) $id, $request->validated('visibility')));
    }

    public function unpublish(Request $request, string $id): ReportResource
    {
        return new ReportResource($this->reports->unpublish($request->user(), (int) $id));
    }
}
