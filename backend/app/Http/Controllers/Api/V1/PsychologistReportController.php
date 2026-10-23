<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ListReportsRequest;
use App\Http\Resources\SharedReportCollection;
use App\Http\Resources\SharedReportResource;
use App\Services\SharedReportService;
use Illuminate\Http\Request;

class PsychologistReportController extends Controller
{
    public function __construct(private SharedReportService $sharedReports) {}

    // {id} e o users.id do paciente: a API nao expoe patients.id
    public function index(ListReportsRequest $request, string $id): SharedReportCollection
    {
        return new SharedReportCollection(
            $this->sharedReports->listForPatient($request->user(), (int) $id, $request->perPage(), $request->page())
        );
    }

    public function show(Request $request, string $id): SharedReportResource
    {
        return new SharedReportResource($this->sharedReports->find($request->user(), (int) $id));
    }
}
