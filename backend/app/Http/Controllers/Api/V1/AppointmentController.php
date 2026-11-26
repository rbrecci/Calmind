<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AppointmentWriteRequest;
use App\Http\Requests\ListAppointmentsRequest;
use App\Http\Resources\AppointmentResource;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function __construct(private AppointmentService $appointments) {}

    public function index(ListAppointmentsRequest $request): JsonResponse
    {
        $appointments = $this->appointments->list($request->user(), $request->validated());

        return response()->json([
            'data' => $appointments->getCollection()->map(fn ($appointment) => (new AppointmentResource($appointment))->toArray($request))->all(),
            'meta' => ['total' => $appointments->total(), 'page' => $appointments->currentPage(), 'per_page' => $appointments->perPage()],
        ]);
    }

    public function store(AppointmentWriteRequest $request): JsonResponse
    {
        return (new AppointmentResource($this->appointments->create($request->user(), $request->validated())))
            ->response()->setStatusCode(201);
    }

    public function update(AppointmentWriteRequest $request, int $id): AppointmentResource
    {
        return new AppointmentResource($this->appointments->update($request->user(), $id, $request->validated()));
    }

    public function cancel(Request $request, int $id): AppointmentResource
    {
        return new AppointmentResource($this->appointments->cancel($request->user(), $id));
    }
}
