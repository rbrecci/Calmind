<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListTasksRequest;
use App\Http\Requests\TaskWriteRequest;
use App\Http\Resources\TaskResource;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PsychologistTaskController extends Controller
{
    public function __construct(private TaskService $tasks) {}

    public function index(ListTasksRequest $request): JsonResponse
    {
        $page = (int) $request->validated('page', 1);
        $perPage = (int) $request->validated('per_page', 20);
        $bondId = $request->validated('bond_id');
        $tasks = $this->tasks->psychologistList($request->user(), $bondId === null ? null : (int) $bondId, $page, $perPage);

        return response()->json([
            'data' => $tasks->getCollection()->map(fn ($task) => (new TaskResource($task))->toArray($request))->all(),
            'meta' => ['total' => $tasks->total(), 'page' => $tasks->currentPage(), 'per_page' => $tasks->perPage()],
        ]);
    }

    public function store(TaskWriteRequest $request): JsonResponse
    {
        return (new TaskResource($this->tasks->create($request->user(), $request->validated())))
            ->response()->setStatusCode(201);
    }

    public function show(Request $request, int $id): TaskResource
    {
        return new TaskResource($this->tasks->psychologistFind($request->user(), $id));
    }

    public function update(TaskWriteRequest $request, int $id): TaskResource
    {
        return new TaskResource($this->tasks->update($request->user(), $id, $request->validated()));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->tasks->archive($request->user(), $id);

        return response()->json(['message' => 'Tarefa arquivada.']);
    }
}
