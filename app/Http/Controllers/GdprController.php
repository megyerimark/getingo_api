<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class GdprController extends Controller
{
    public function exportData(Request $request)
    {
        $user = $request->user();

        $payload = [
            'exported_at' => now()->toIso8601String(),
            'account' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'xp_points' => $user->xp_points,
                'current_streak' => $user->current_streak,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
            'notes' => $user->notes()
                ->select('id', 'user_id', 'lesson_id', 'content', 'created_at', 'updated_at')
                ->get(),
            'favorites' => $user->favorites()
                ->select('id', 'user_id', 'lesson_id', 'created_at', 'updated_at')
                ->get(),
            'lesson_progress' => $user->lessonProgress()
                ->select('id', 'user_id', 'lesson_id', 'completed', 'created_at', 'updated_at')
                ->get(),
            'quiz_completions' => $user->quizCompletions()
                ->select('id', 'user_id', 'quiz_id', 'created_at', 'updated_at')
                ->get(),
            'companion' => $user->companion()
                ->select(
                    'id',
                    'user_id',
                    'name',
                    'care_points',
                    'growth_points',
                    'water',
                    'hunger',
                    'happiness',
                    'selected_skin',
                    'last_interaction_at',
                    'last_decay_at',
                    'created_at',
                    'updated_at'
                )
                ->first(),
        ];

        return response()->json($payload)
            ->header('Content-Disposition', 'attachment; filename="getingo-data-'.$user->id.'.json"')
            ->header('Cache-Control', 'no-store, private');
    }

    public function deleteAccount(Request $request)
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'max:1024'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'A megadott jelszó hibás.',
            ], 422);
        }

        if ($user->role === 'admin' && User::where('role', 'admin')->count() <= 1) {
            return response()->json([
                'message' => 'Az utolsó adminisztrátori fiók nem törölhető. Előbb hozz létre egy másik admint.',
            ], 409);
        }

        DB::transaction(function () use ($user): void {
            $user->tokens()->delete();

            if (Schema::hasTable('sessions')) {
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }

            if (Schema::hasTable('password_reset_tokens')) {
                DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            }

            $user->delete();
        });

        return response()->json([
            'message' => 'A fiók és a hozzá kapcsolódó személyes adatok törlése megtörtént.',
        ]);
    }
}
