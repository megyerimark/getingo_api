<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index()
    {
        return response()->json(
            User::select(
                'id',
                'name',
                'email',
                'role',
                'is_banned',
                'created_at'
            )->paginate(21)
        );
    }

    public function updateRole(Request $request, $id)
    {
        $validated = $request->validate([
            'role' => ['required', 'in:admin,student'],
        ]);

        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'A saját szerepkörödet nem módosíthatod.'
            ], 403);
        }

        $user->update([
            'role' => $validated['role']
        ]);

        return response()->json([
            'message' => 'Szerepkör sikeresen frissítve!',
            'user' => $user,
        ]);
    }

    public function toggleBan(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'Saját magadat nem tilthatod ki!'
            ], 403);
        }

        $user->is_banned = !$user->is_banned;
        $user->save();

        if ($user->is_banned) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $user->is_banned
                ? 'Felhasználó kitiltva!'
                : 'Felhasználó visszaengedve!',
            'is_banned' => $user->is_banned,
        ]);
    }
}