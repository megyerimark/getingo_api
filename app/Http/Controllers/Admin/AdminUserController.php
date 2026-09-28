<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(max($request->integer('per_page', 21), 1), 100);

        return response()->json(
            User::query()
                ->select('id', 'name', 'email', 'role', 'is_banned', 'xp_points', 'current_streak', 'created_at')
                ->orderByDesc('created_at')
                ->paginate($perPage)
        );
    }

    public function updateRole(Request $request, int $id)
    {
        $validated = $request->validate([
            'role' => ['required', 'in:admin,student'],
        ]);

        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'A saját szerepkörödet nem módosíthatod.',
            ], 403);
        }

        $oldRole = $user->role;
        $user->role = $validated['role'];
        $user->save();

        AuditLogger::record($request, 'user.role.updated', $user, [
            'old_role' => $oldRole,
            'new_role' => $user->role,
        ]);

        return response()->json([
            'message' => 'Szerepkör sikeresen frissítve!',
            'user' => $user->only(['id', 'name', 'email', 'role', 'is_banned']),
        ]);
    }

    public function toggleBan(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'Saját magadat nem tilthatod ki!',
            ], 403);
        }

        $user->is_banned = !$user->is_banned;
        $user->save();

        if ($user->is_banned) {
            $user->tokens()->delete();
        }

        AuditLogger::record($request, 'user.ban.toggled', $user, [
            'is_banned' => $user->is_banned,
        ]);

        return response()->json([
            'message' => $user->is_banned
                ? 'Felhasználó kitiltva!'
                : 'Felhasználó visszaengedve!',
            'is_banned' => $user->is_banned,
        ]);
    }
}
