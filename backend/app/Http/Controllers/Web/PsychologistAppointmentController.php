<?php

namespace App\Http\Controllers\Web;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentFormRequest;
use App\Models\Bond;
use App\Services\AppointmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PsychologistAppointmentController extends Controller
{
    public function __construct(private AppointmentService $appointments) {}

    public function index(Request $request): View
    {
        $psychologistId = $request->user()->psychologist?->id ?? 0;

        return view('psychologist.appointments', [
            'activeBonds' => Bond::with('patient.user')
                ->where('psychologist_id', $psychologistId)
                ->where('status', 'active')
                ->orderBy('id')
                ->get(),
            'appointments' => $this->appointments->list($request->user(), ['per_page' => 100])->getCollection(),
        ]);
    }

    public function store(StoreAppointmentFormRequest $request): RedirectResponse
    {
        try {
            $this->appointments->create($request->user(), $request->validated());
        } catch (ApiException $e) {
            // O unico ApiException do create e o vinculo inativo: sem isto o 409 viraria pagina crua de erro
            return redirect()->route('psychologist.appointments.index')
                ->withInput()->withErrors(['bond_id' => $e->getMessage()]);
        }

        return redirect()->route('psychologist.appointments.index')->with('status', 'Consulta agendada.');
    }
}
