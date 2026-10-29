<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CurrentConsentTermRequest;
use App\Http\Requests\StoreConsentAcceptanceRequest;
use App\Http\Resources\ConsentAcceptanceResource;
use App\Services\ConsentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsentController extends Controller
{
    public function __construct(private ConsentService $consents) {}

    public function current(CurrentConsentTermRequest $request): JsonResponse
    {
        $term = $this->consents->current($request->validated('type', 'general'));
        abort_if($term === null, 404);
        $attributes = $term->attributesToArray();

        return response()->json([
            'id' => $term->id,
            'type' => $term->type,
            'version' => $term->version,
            'body' => $term->body,
            'effective_from' => $attributes['effective_from'],
            'accepted' => $this->consents->hasAccepted($request->user(), $term->type),
        ]);
    }

    public function store(StoreConsentAcceptanceRequest $request): JsonResponse
    {
        $acceptance = $this->consents->accept($request->user(), (int) $request->validated('consent_term_id'));

        return response()->json((new ConsentAcceptanceResource($acceptance))->toArray($request), $acceptance->wasRecentlyCreated ? 201 : 200);
    }

    public function revoke(Request $request, int $id): ConsentAcceptanceResource
    {
        return new ConsentAcceptanceResource($this->consents->revoke($request->user(), $id));
    }
}
