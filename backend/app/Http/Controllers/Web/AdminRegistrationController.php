<?php

namespace App\Http\Controllers\Web;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\RejectPsychologistRegistrationRequest;
use App\Models\Psychologist;
use App\Services\PsychologistRegistrationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminRegistrationController extends Controller
{
    public function __construct(private PsychologistRegistrationService $registrations) {}

    public function index(): View
    {
        return view('admin.registrations', [
            'registrations' => Psychologist::with(['user', 'documents'])
                ->where('approval_status', 'pending')
                ->orderBy('created_at')
                ->orderBy('id')
                ->paginate(20),
        ]);
    }

    public function approve(Request $request, int $id): RedirectResponse
    {
        return $this->decide($request, $id, 'approved', null, 'Cadastro aprovado.');
    }

    public function reject(RejectPsychologistRegistrationRequest $request, int $id): RedirectResponse
    {
        return $this->decide($request, $id, 'rejected', $request->validated('reason'), 'Cadastro reprovado.');
    }

    public function document(Request $request, int $id): StreamedResponse
    {
        $document = $this->registrations->document($request->user(), $id);

        return Storage::disk('local')->download($document->file_path, $document->original_name);
    }

    private function decide(Request $request, int $id, string $decision, ?string $reason, string $status): RedirectResponse
    {
        $back = redirect()->route('admin.registrations.index');

        try {
            $this->registrations->decide($request->user(), $id, $decision, $reason);
        } catch (ApiException $e) {
            return $back->withErrors(['registration' => $e->getMessage()]);
        }

        return $back->with('status', $status);
    }
}
