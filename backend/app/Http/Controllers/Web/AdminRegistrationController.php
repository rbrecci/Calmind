<?php

namespace App\Http\Controllers\Web;

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
        $this->registrations->decide($request->user(), $id, 'approved');

        return redirect()->route('admin.registrations.index')->with('status', 'Cadastro aprovado.');
    }

    public function reject(RejectPsychologistRegistrationRequest $request, int $id): RedirectResponse
    {
        $this->registrations->decide($request->user(), $id, 'rejected', $request->validated('reason'));

        return redirect()->route('admin.registrations.index')->with('status', 'Cadastro reprovado.');
    }

    public function document(Request $request, int $id): StreamedResponse
    {
        $document = $this->registrations->document($request->user(), $id);

        return Storage::disk('local')->download($document->file_path, $document->original_name);
    }
}
