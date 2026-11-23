<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Bond;
use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    public function create(int $userId, string $type, int $resourceId): Notification
    {
        return Notification::create(['user_id' => $userId, 'type' => $type, 'resource_id' => $resourceId]);
    }

    public function paginate(User $user, array $filters): LengthAwarePaginator
    {
        // o app percorre todas as paginas; so a primeira gera lembrete para nao travar o usuario a cada pagina
        if ((int) ($filters['page'] ?? 1) === 1) {
            $this->materializeReminders($user);
        }

        return Notification::where('user_id', $user->id)
            ->when($filters['unread'] ?? false, fn ($query) => $query->whereNull('read_at'))
            ->orderByDesc('created_at')->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 20, page: $filters['page'] ?? 1);
    }

    public function read(User $user, int $id): Notification
    {
        $notification = Notification::where('user_id', $user->id)->findOrFail($id);
        Notification::whereKey($id)->whereNull('read_at')->update(['read_at' => now()]);

        return $notification->refresh();
    }

    public function readAll(User $user): int
    {
        return Notification::where('user_id', $user->id)->whereNull('read_at')->update(['read_at' => now()]);
    }

    // RF-16: sem agendador no servidor, os lembretes nascem quando o usuario consulta as notificacoes
    private function materializeReminders(User $user): void
    {
        DB::transaction(function () use ($user): void {
            // trava o usuario para duas consultas simultaneas nao criarem o mesmo lembrete
            User::whereKey($user->id)->lockForUpdate()->first();
            $psychologist = $user->role === 'psychologist';
            $owner = $psychologist ? ($user->psychologist?->approval_status === 'approved' ? $user->psychologist->id : 0) : ($user->patient?->id ?? 0);
            $bondIds = Bond::where('status', 'active')->where($psychologist ? 'psychologist_id' : 'patient_id', $owner)->pluck('id');
            // id do recurso => inicio da janela da data atual; lembrete anterior a ele e de outra data e nao conta
            // na consulta o marco e scheduled_at menos 1 dia, para editar so notes ou modality nao gerar outro lembrete
            $due = [
                'appointment.upcoming' => Appointment::whereIn('bond_id', $bondIds)->whereIn('status', ['scheduled', 'rescheduled'])
                    ->where('scheduled_at', '>', now())->where('scheduled_at', '<=', now()->addDay())->pluck('scheduled_at', 'id')
                    ->map(fn ($at) => $at->copy()->subDay()),
            ];
            if (! $psychologist) {
                // o prazo e uma data e so vence no dia seguinte (como em PatientDirectoryService), entao vence em 24h quem tem prazo hoje
                // tasks nao tem updated_at; o lembrete do prazo atual so pode ter nascido hoje
                $due['task.due_soon'] = Task::whereIn('bond_id', $bondIds)->whereNull('completed_at')->whereNull('archived_at')
                    ->where('due_date', today()->toDateString())->pluck('id')->mapWithKeys(fn ($id) => [$id => today()]);
            }
            foreach ($due as $type => $changedAt) {
                $sent = Notification::where('user_id', $user->id)->where('type', $type)->whereIn('resource_id', $changedAt->keys())
                    ->groupBy('resource_id')->selectRaw('resource_id, max(created_at) as last_at')->pluck('last_at', 'resource_id');
                foreach ($changedAt as $id => $since) {
                    if (! isset($sent[$id]) || Carbon::parse($sent[$id])->lt($since)) {
                        $this->create($user->id, $type, $id);
                    }
                }
            }
        });
    }
}
