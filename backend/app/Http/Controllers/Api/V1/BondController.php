<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RequestBondRequest;
use App\Http\Resources\BondResource;
use App\Services\BondService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BondController extends Controller
{
    public function __construct(private BondService $bonds) {}

    public function request(RequestBondRequest $request): JsonResponse
    {
        $bond = $this->bonds->request($request->user(), $request->validated('psychologist_id'));

        return (new BondResource($bond))->response()->setStatusCode(201);
    }

    public function accept(Request $request, int $id): BondResource
    {
        return new BondResource($this->bonds->accept($request->user(), $id));
    }

    public function reject(Request $request, int $id): BondResource
    {
        return new BondResource($this->bonds->reject($request->user(), $id));
    }

    public function end(Request $request, int $id): BondResource
    {
        return new BondResource($this->bonds->end($request->user(), $id));
    }
}
