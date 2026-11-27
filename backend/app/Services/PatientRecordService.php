<?php

namespace App\Services;

use App\Http\Resources\AnalysisResource;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\MedicationResource;
use App\Http\Resources\PatientDetailResource;
use App\Http\Resources\SharedReportResource;
use App\Http\Resources\TaskResource;
use App\Models\Analysis;
use App\Models\Appointment;
use App\Models\Bond;
use App\Models\Medication;
use App\Models\SharedReport;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

// RF-36: prontuario consolidado. Reune em ordem cronologica, para um paciente vinculado ao psicologo,
// relatos compartilhados, tarefas, consultas, registros de medicacao e analises confirmadas.
//  - o acesso (e a trilha de auditoria, CA-36.2) vem de PatientDirectoryService::patient(): sem vinculo e 404 (CA-36.3);
//  - relato so pela view shared_reports (CA-36.4, RNF-08): nao ha como o privado entrar aqui;
//  - sugestao de IA nao confirmada nunca entra: so analise `confirmed` (RF-42).
class PatientRecordService
{
    // por tipo: um prontuario de periodo longo nao pode virar resposta gigante
    private const LIMIT_PER_TYPE = 200;

    public function __construct(private PatientDirectoryService $directory) {}

    /** @return array<string, mixed> */
    public function record(User $user, int $patientUserId, Carbon $from, Carbon $to, string $order, Request $request): array
    {
        $bond = $this->directory->patient($user, $patientUserId);

        // todos os vinculos deste psicologo com este paciente: o historico de um vinculo encerrado continua dele
        $bondIds = Bond::query()->where('psychologist_id', $bond->psychologist_id)->where('patient_id', $bond->patient_id)
            ->whereIn('status', ['active', 'ended'])->pluck('id');

        $timeline = collect()
            ->concat($this->sharedReportItems($bondIds, $from, $to, $request))
            ->concat($this->tasks($bondIds, $from, $to, $request))
            ->concat($this->appointments($bondIds, $from, $to, $request))
            ->concat($this->medications($bondIds, $from, $to, $request))
            ->concat($this->analyses($bondIds, $from, $to, $request));

        $timeline = ($order === 'desc' ? $timeline->sortByDesc('at') : $timeline->sortBy('at'))->values();

        return array_merge((new PatientDetailResource($bond))->toArray($request), [
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'order' => $order,
            'totals' => $timeline->countBy('type')->all(),
            'timeline' => $timeline->all(),
        ]);
    }

    private function entry(string $type, mixed $at, int $id, array $data): array
    {
        return ['type' => $type, 'at' => Carbon::parse($at)->toIso8601String(), 'id' => $id, 'data' => $data];
    }

    private function sharedReportItems(Collection $bondIds, Carbon $from, Carbon $to, Request $request): Collection
    {
        // RNF-08: so a view
        return SharedReport::query()->whereIn('bond_id', $bondIds)->whereBetween('created_at', [$from, $to])
            ->orderByDesc('created_at')->limit(self::LIMIT_PER_TYPE)->get()
            ->map(fn (SharedReport $r) => $this->entry('report', $r->created_at, $r->id, (new SharedReportResource($r))->toArray($request)));
    }

    private function tasks(Collection $bondIds, Carbon $from, Carbon $to, Request $request): Collection
    {
        return Task::query()->whereIn('bond_id', $bondIds)->whereNull('archived_at')->whereBetween('created_at', [$from, $to])
            ->orderByDesc('created_at')->limit(self::LIMIT_PER_TYPE)->get()
            ->map(fn (Task $t) => $this->entry('task', $t->created_at, $t->id, (new TaskResource($t))->toArray($request)));
    }

    private function appointments(Collection $bondIds, Carbon $from, Carbon $to, Request $request): Collection
    {
        return Appointment::query()->with('bond.patient.user')->whereIn('bond_id', $bondIds)->whereBetween('scheduled_at', [$from, $to])
            ->orderByDesc('scheduled_at')->limit(self::LIMIT_PER_TYPE)->get()
            ->map(fn (Appointment $a) => $this->entry('appointment', $a->scheduled_at, $a->id, (new AppointmentResource($a))->toArray($request)));
    }

    private function medications(Collection $bondIds, Carbon $from, Carbon $to, Request $request): Collection
    {
        return Medication::query()->with(['schedules', 'bond'])->whereIn('bond_id', $bondIds)->whereBetween('created_at', [$from, $to])
            ->orderByDesc('created_at')->limit(self::LIMIT_PER_TYPE)->get()
            ->map(fn (Medication $m) => $this->entry('medication', $m->created_at, $m->id, (new MedicationResource($m))->toArray($request)));
    }

    private function analyses(Collection $bondIds, Carbon $from, Carbon $to, Request $request): Collection
    {
        // RF-42: so o que o psicologo confirmou; sugestao em revisao ou descartada nao aparece
        return Analysis::query()->with('versions')->whereIn('bond_id', $bondIds)->where('status', 'confirmed')
            ->whereBetween('confirmed_at', [$from, $to])->orderByDesc('confirmed_at')->limit(self::LIMIT_PER_TYPE)->get()
            ->map(fn (Analysis $a) => $this->entry('analysis', $a->confirmed_at, $a->id, (new AnalysisResource($a))->toArray($request)));
    }
}
