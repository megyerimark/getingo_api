<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->email)),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(12)->mixedCase()->numbers(),
            ],
            'privacy_accepted' => ['required', 'accepted'],
        ], [
            'privacy_accepted.accepted' => 'A regisztrációhoz el kell olvasnod és tudomásul kell venned az Adatkezelési tájékoztatót.',
            'privacy_accepted.required' => 'A regisztrációhoz el kell olvasnod és tudomásul kell venned az Adatkezelési tájékoztatót.',
        ]);

        $user = User::create([
            'name' => trim($validated['name']),
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'privacy_accepted_at' => now(),
            'privacy_policy_version' => config('privacy.version'),
        ]);

        $user->sendEmailVerificationNotification();

        Auth::guard('web')->login($user);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'message' => 'Sikeres regisztráció! Küldtünk egy megerősítő emailt.',
            'user' => $user->fresh(),
        ], 201);
    }

    public function login(Request $request)
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->email)),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Hibás email cím vagy jelszó.',
            ], 401);
        }

        if ($user->is_banned) {
            return response()->json([
                'message' => 'A felhasználói fiók le van tiltva.',
            ], 403);
        }

        Auth::guard('web')->login($user);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'message' => 'Sikeres bejelentkezés!',
            'user' => $user->fresh(),
        ], 200);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->fresh(),
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Sikeres kijelentkezés!',
        ]);
    }
}
