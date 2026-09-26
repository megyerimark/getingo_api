<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
 public function index()
    {
        $users = User::select('id', 'name', 'email', 'role', 'is_banned', 'created_at')->get();
        
        return response()->json($users, 200);
    }

    public function updateRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|in:admin,student'
        ]);
        
        $user = User::findOrFail($id);
        $user->role = $request->role;
        $user->save();

        return response()->json([
            'message' => 'Szerepkör sikeresen frissítve!',
            'user' => $user
        ], 200);
    }

    public function toggleBan($id)
    {
        $user = User::findOrFail($id);
        
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Saját magadat nem tilthatod ki!'], 403);
        }

        $user->is_banned = !$user->is_banned;
        $user->save();

        $status = $user->is_banned ? 'kitiltva' : 'visszaengedve';
        
        return response()->json([
            'message' => "A felhasználó sikeresen {$status}!",
            'is_banned' => $user->is_banned
        ], 200);
    }

}
