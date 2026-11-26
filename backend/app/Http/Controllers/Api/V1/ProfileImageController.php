<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileImageRequest;
use App\Http\Resources\UserResource;
use App\Services\ProfileImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProfileImageController extends Controller
{
    public function __construct(private ProfileImageService $images) {}

    public function update(UpdateProfileImageRequest $request, string $kind): UserResource
    {
        return new UserResource($this->images->replace($request->user(), $kind, $request->file('image')));
    }

    public function destroy(Request $request, string $kind): UserResource
    {
        return new UserResource($this->images->remove($request->user(), $kind));
    }

    // Cache curto e privado: o ?v= da URL muda a cada troca, entao o app nao fica preso na imagem velha
    public function show(Request $request, int $id, string $kind): StreamedResponse
    {
        return Storage::disk('local')->response(
            $this->images->path($request->user(), $id, $kind),
            null,
            ['Cache-Control' => 'private, max-age=300']
        );
    }
}
