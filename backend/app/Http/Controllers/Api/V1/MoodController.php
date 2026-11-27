<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListMoodsRequest;
use App\Http\Requests\MarkMoodRequest;
use App\Http\Resources\MoodCollection;
use App\Http\Resources\MoodResource;
use App\Services\MoodService;
use Illuminate\Http\JsonResponse;

class MoodController extends Controller
{
    public function __construct(private MoodService $moods) {}

    public function index(ListMoodsRequest $request): MoodCollection
    {
        return new MoodCollection($this->moods->paginateOwn(
            $request->user(), $request->validated('from'), $request->validated('to'), $request->perPage(), $request->page()
        ));
    }

    // 200 tanto na primeira marcacao quanto na troca: para o app e a mesma acao
    public function markToday(MarkMoodRequest $request): JsonResponse
    {
        $mood = $this->moods->markToday($request->user(), $request->validated('mood'));

        return (new MoodResource($mood))->response()->setStatusCode(200);
    }

    // {id} e o users.id do paciente, como nas demais rotas do psicologo
    public function forPatient(ListMoodsRequest $request, string $id): MoodCollection
    {
        return new MoodCollection($this->moods->paginateForPatient(
            $request->user(), (int) $id, $request->validated('from'), $request->validated('to'), $request->perPage(), $request->page()
        ));
    }
}
