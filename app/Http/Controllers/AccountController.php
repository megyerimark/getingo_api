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
        if ($request->has('email')) {
            $request->merge([
                'email' => Str::lower(trim((string) $request->input('email'))),
            ]);
        }

        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => [
                'sometimes',
                'required',
                'email:rfc',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'current_password' => ['nullable', 'string', 'max:1024'],
        ]);

        $emailChanged = isset($validated['email'])
            && $validated['email'] !== $user->email;

        if ($emailChanged) {
            if (
                empty($validated['current_password']) ||
                !Hash::check($validated['current_password'], $user->password)
            ) {
                return response()->json([
                    'message' => 'Az email cím módosításához add meg a jelenlegi jelszavadat.',
                ], 422);
            }

            $user->email = $validated['email'];
            $user->email_verified_at = null;
        }

        if (isset($validated['name'])) {
            $user->name = strip_tags($validated['name']);
        }

        $user->save();

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'message' => $emailChanged
                ? 'A fiók adatai frissültek. Az új email címre megerősítő levelet küldtünk.'
                : 'A fiók adatai sikeresen frissítve.',
            'user' => $user->only([
                'id',
                'name',
                'email',
                'email_verified_at',
                'role',
                'is_banned',
                'xp_points',
                'current_streak',
                'created_at',
                'updated_at',
            ]),
        ]);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string', 'max:1024'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(12)->mixedCase()->numbers(),
            ],
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'A jelenlegi jelszó hibás.',
            ], 422);
        }

        $user->password = $validated['password'];
        $user->save();

        $user->tokens()->delete();

        return response()->json([
            'message' => 'A jelszó sikeresen megváltozott. Jelentkezz be újra.',
        ]);
    }
}
