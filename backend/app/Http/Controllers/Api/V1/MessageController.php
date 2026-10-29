<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListMessagesRequest;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Services\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(private MessageService $messages) {}

    public function index(ListMessagesRequest $request, int $id): JsonResponse
    {
        $messages = $this->messages->list($request->user(), $id, $request->validated());

        return response()->json([
            'data' => $messages->getCollection()->map(fn ($message) => (new MessageResource($message))->toArray($request))->all(),
            'meta' => ['total' => $messages->total(), 'page' => $messages->currentPage(), 'per_page' => $messages->perPage()],
        ]);
    }

    public function store(StoreMessageRequest $request, int $id): JsonResponse
    {
        return (new MessageResource($this->messages->send($request->user(), $id, $request->validated('body'))))
            ->response()->setStatusCode(201);
    }

    public function read(Request $request, int $id): JsonResponse
    {
        return response()->json(['read' => $this->messages->read($request->user(), $id)]);
    }
}
