<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePsychologistRegistrationRequest;
use App\Http\Requests\UpdatePsychologistProfileRequest;
use App\Models\Psychologist;
use App\Services\PsychologistRegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PsychologistRegistrationController extends Controller
{
    public function __construct(private PsychologistRegistrationService $registrations) {}

    public function store(StorePsychologistRegistrationRequest $request): JsonResponse
    {
        $existing = $request->user()->psychologist !== null;
        $psychologist = $this->registrations->register(
            $request->user(),
            $request->validated(),
            $request->file('document')
        );

        return response()->json($this->profile($psychologist), $existing ? 200 : 201);
    }

    public function update(UpdatePsychologistProfileRequest $request): JsonResponse
    {
        return response()->json($this->profile(
            $this->registrations->updateProfile($request->user(), $request->validated())
        ));
    }

    public function publish(Request $request): JsonResponse
    {
        return response()->json($this->profile($this->registrations->publish($request->user())));
    }

    public function document(Request $request, int $id): StreamedResponse
    {
        $document = $this->registrations->document($request->user(), $id);

        return Storage::disk('local')->download($document->file_path, $document->original_name);
    }

    private function profile(Psychologist $psychologist): array
    {
        return [
            'id' => $psychologist->id,
            'crp' => $psychologist->crp_region.'/'.$psychologist->crp_number,
            'approval_status' => $psychologist->approval_status,
            'approval_note' => $psychologist->approval_note,
            'profile_approach' => $psychologist->profile_approach,
            'profile_specialty' => $psychologist->profile_specialty,
            'profile_modality' => $psychologist->profile_modality,
            'profile_region' => $psychologist->profile_region,
            'profile_bio' => $psychologist->profile_bio,
            'profile_published_at' => $psychologist->profile_published_at?->toIso8601String(),
        ];
    }
}
