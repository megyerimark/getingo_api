<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AccountController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();
        $originalEmail = $user->email;

        $request->merge([
            'email' => Str::lower(trim((string) $request->email)),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->name = trim($validated['name']);
        $user->email = $validated['email'];

        if ($originalEmail !== $validated['email']) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($originalEmail !== $validated['email']) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'message' => $originalEmail !== $validated['email']
                ? 'A profil frissült. Az új email cím megerősítéséhez elküldtük a linket.'
                : 'A profil frissítése sikerült.',
            'user' => $user->fresh(),
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'A jelenlegi jelszó hibás.',
            ], 422);
        }

        $user->password = $validated['password'];
        $user->save();

        return response()->json([
            'message' => 'A jelszó módosítása sikerült.',
        ]);
    }
}
