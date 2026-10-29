<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListNotificationsRequest;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notifications) {}

    public function index(ListNotificationsRequest $request): JsonResponse
    {
        $notifications = $this->notifications->paginate($request->user(), $request->validated());

        return response()->json([
            'data' => $notifications->getCollection()->map(fn ($notification) => (new NotificationResource($notification))->toArray($request))->all(),
            'meta' => ['total' => $notifications->total(), 'page' => $notifications->currentPage(), 'per_page' => $notifications->perPage()],
        ]);
    }

    public function read(Request $request, int $id): NotificationResource
    {
        return new NotificationResource($this->notifications->read($request->user(), $id));
    }

    public function readAll(Request $request): JsonResponse
    {
        return response()->json(['read' => $this->notifications->readAll($request->user())]);
    }
}
