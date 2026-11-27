<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PatientRecordRequest;
use App\Services\PatientRecordService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

// RF-36
class PsychologistRecordController extends Controller
{
    public function __construct(private PatientRecordService $records) {}

    public function show(PatientRecordRequest $request, int $id): JsonResponse
    {
        $to = Carbon::parse($request->validated('to', now()->toDateString()))->endOfDay();
        $from = Carbon::parse($request->validated('from', $to->copy()->subDays(29)->toDateString()))->startOfDay();

        return response()->json($this->records->record($request->user(), $id, $from, $to, $request->validated('order', 'asc'), $request));
    }
}
