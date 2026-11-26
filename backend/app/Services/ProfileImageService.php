<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class ProfileImageService
{
    private const DIRECTORIES = ['avatar' => 'avatars', 'cover' => 'covers'];

    public function replace(User $user, string $kind, UploadedFile $image): User
    {
        $column = $kind.'_path';
        $old = $user->{$column};
        $path = $image->store(self::DIRECTORIES[$kind], 'local');

        try {
            $user->update([$column => $path]);
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($path);
            throw $e;
        }

        if ($old !== null) {
            Storage::disk('local')->delete($old);
        }

        return $user;
    }

    public function remove(User $user, string $kind): User
    {
        $column = $kind.'_path';
        $old = $user->{$column};

        if ($old !== null) {
            $user->update([$column => null]);
            Storage::disk('local')->delete($old);
        }

        return $user;
    }

    // A permissao e conferida antes da existencia: sem acesso e 403 mesmo sem imagem, para nao revelar se o paciente tem foto
    public function path(User $viewer, int $ownerId, string $kind): string
    {
        $owner = User::findOrFail($ownerId);
        Gate::forUser($viewer)->authorize('viewProfileImage', $owner);

        $path = $owner->{$kind.'_path'};
        abort_if($path === null || ! Storage::disk('local')->exists($path), 404);

        return $path;
    }
}
