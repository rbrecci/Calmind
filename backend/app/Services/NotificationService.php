<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationService
{
    public function create(int $userId, string $type, int $resourceId): Notification
    {
        return Notification::create(['user_id' => $userId, 'type' => $type, 'resource_id' => $resourceId]);
    }

    public function paginate(User $user, array $filters): LengthAwarePaginator
    {
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
}
