<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Bond;
use App\Models\Message;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class MessageService
{
    public function list(User $user, int $bondId, array $filters): LengthAwarePaginator
    {
        $bond = $this->participantBond($user, $bondId);

        return Message::where('bond_id', $bond->id)
            ->when(isset($filters['after_id']), fn ($query) => $query->where('id', '>', $filters['after_id']))
            ->orderBy('id')->paginate($filters['per_page'] ?? 50, page: $filters['page'] ?? 1);
    }

    public function send(User $user, int $bondId, string $body): Message
    {
        return DB::transaction(function () use ($user, $bondId, $body): Message {
            $bond = $this->participantBond($user, $bondId);
            if ($bond->status !== 'active') {
                throw new ApiException(409, 'O vínculo não está ativo.');
            }

            if (! app(ConsentService::class)->hasAccepted($bond->patient->user)) {
                throw new ApiException(403, 'É preciso aceitar o termo de uso antes de enviar mensagens.');
            }

            $message = Message::create(['bond_id' => $bond->id, 'sender_user_id' => $user->id, 'body' => $body]);
            $recipient = $user->id === $bond->patient->user_id ? $bond->psychologist->user_id : $bond->patient->user_id;
            app(NotificationService::class)->create($recipient, 'message.received', $message->id);

            return $message->refresh();
        });
    }

    public function read(User $user, int $bondId): int
    {
        $bond = $this->participantBond($user, $bondId);

        return Message::where('bond_id', $bond->id)->where('sender_user_id', '!=', $user->id)
            ->whereNull('read_at')->update(['read_at' => now()]);
    }

    private function participantBond(User $user, int $id): Bond
    {
        $query = Bond::query()->with(['patient.user', 'psychologist.user']);
        if ($user->role === 'patient') {
            $query->where('patient_id', $user->patient?->id ?? 0);
        } elseif ($user->role === 'psychologist') {
            $query->where('psychologist_id', $user->psychologist?->id ?? 0);
        } else {
            abort(404);
        }
        $bond = $query->findOrFail($id);
        if ($user->role === 'psychologist' && $user->psychologist?->approval_status !== 'approved') {
            abort(403);
        }

        return $bond;
    }
}
