<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RedeemInvitationRequest;
use App\Http\Resources\BondResource;
use App\Http\Resources\InvitationResource;
use App\Http\Resources\RevokedInvitationResource;
use App\Services\InvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    public function __construct(private InvitationService $invitations) {}

    public function store(Request $request): JsonResponse
    {
        return (new InvitationResource($this->invitations->generate($request->user())))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Request $request, int $id): RevokedInvitationResource
    {
        return new RevokedInvitationResource($this->invitations->revoke($request->user(), $id));
    }

    public function redeem(RedeemInvitationRequest $request): JsonResponse
    {
        $bond = $this->invitations->redeem($request->user(), $request->validated('code'), $request->ip());

        return (new BondResource($bond))->response()->setStatusCode(201);
    }
}
