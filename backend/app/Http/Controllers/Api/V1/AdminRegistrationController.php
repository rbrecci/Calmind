<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RejectPsychologistRegistrationRequest;
use App\Models\Psychologist;
use App\Services\PsychologistRegistrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminRegistrationController extends Controller
{
    public function __construct(private PsychologistRegistrationService $registrations) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', Rule::in(['pending', 'approved', 'rejected'])],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);
        $page = Psychologist::with(['user', 'documents'])
            ->where('approval_status', $filters['status'] ?? 'pending')
            ->orderBy('created_at')
            ->orderBy('id')
            ->paginate(20);

        return response()->json([
            'data' => $page->getCollection()->map(fn (Psychologist $psychologist) => $this->summary($psychologist))->all(),
            'meta' => ['total' => $page->total(), 'page' => $page->currentPage(), 'per_page' => 20],
        ]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        return response()->json($this->summary($this->registrations->decide($request->user(), $id, 'approved')));
    }

    public function reject(RejectPsychologistRegistrationRequest $request, int $id): JsonResponse
    {
        return response()->json($this->summary(
            $this->registrations->decide($request->user(), $id, 'rejected', $request->validated('reason'))
        ));
    }

    public function document(Request $request, int $id): StreamedResponse
    {
        $document = $this->registrations->document($request->user(), $id);

        return Storage::disk('local')->download($document->file_path, $document->original_name);
    }

    private function summary(Psychologist $psychologist): array
    {
        $psychologist->loadMissing(['user', 'documents']);

        return [
            'id' => $psychologist->id,
            'name' => $psychologist->user->name,
            'email' => $psychologist->user->email,
            'crp' => $psychologist->crp_region.'/'.$psychologist->crp_number,
            'approval_status' => $psychologist->approval_status,
            'approval_note' => $psychologist->approval_note,
            'documents' => $psychologist->documents->map(fn ($document) => [
                'id' => $document->id,
                'name' => $document->original_name,
            ])->all(),
            'created_at' => $psychologist->created_at?->toIso8601String(),
        ];
    }
}
