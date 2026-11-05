<?php

namespace App\Http\Controllers\Web;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\TaskWriteRequest;
use App\Models\Bond;
use App\Services\TaskService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PsychologistTaskController extends Controller
{
    public function __construct(private TaskService $tasks) {}

    public function index(Request $request): View
    {
        $psychologistId = $request->user()->psychologist?->id ?? 0;

        return view('psychologist.tasks', [
            'activeBonds' => Bond::with('patient.user')
                ->where('psychologist_id', $psychologistId)
                ->where('status', 'active')
                ->orderBy('id')
                ->get(),
            'tasks' => $this->tasks->psychologistList($request->user(), null, 1, 100)
                ->getCollection()->load('bond.patient.user'),
        ]);
    }

    public function store(TaskWriteRequest $request): RedirectResponse
    {
        try {
            $this->tasks->create($request->user(), $request->validated());
        } catch (ApiException $e) {
            // Vinculo inativo ou paciente sem aceite: sem isto o psicologo cairia em pagina crua de erro
            return redirect()->route('psychologist.tasks.index')
                ->withInput()->withErrors(['bond_id' => $e->getMessage()]);
        }

        return redirect()->route('psychologist.tasks.index')->with('status', 'Tarefa criada.');
    }
}
