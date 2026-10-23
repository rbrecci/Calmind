<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListTasksRequest;
use App\Http\Resources\TaskResource;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientTaskController extends Controller
{
    public function __construct(private TaskService $tasks) {}

    public function index(ListTasksRequest $request): JsonResponse
    {
        $page = (int) $request->validated('page', 1);
        $perPage = (int) $request->validated('per_page', 20);
        $tasks = $this->tasks->patientList($request->user(), $page, $perPage);

        return response()->json([
            'data' => $tasks->getCollection()->map(fn ($task) => (new TaskResource($task))->toArray($request))->all(),
            'meta' => ['total' => $tasks->total(), 'page' => $tasks->currentPage(), 'per_page' => $tasks->perPage()],
        ]);
    }

    public function show(Request $request, int $id): TaskResource
    {
        return new TaskResource($this->tasks->patientFind($request->user(), $id));
    }

    public function complete(Request $request, int $id): TaskResource
    {
        return new TaskResource($this->tasks->complete($request->user(), $id));
    }
}
