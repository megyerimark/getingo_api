<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => [
                'required',
                'string',
                'confirmed',
                Password::min(12)->mixedCase()->numbers(),
            ],
        ]);

        $user = User::create([
            'name' => strip_tags($validated['name']),
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        $token = $user->createToken(
            'auth_token',
            ['*'],
            now()->addMinutes((int) config('sanctum.expiration', 1440))
        )->plainTextToken;

        return $this->authResponse('Sikeres regisztráció!', $user, $token, 201);
    }

    public function login(Request $request)
    {
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
            'password' => ['required', 'string', 'max:1024'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Hibás email vagy jelszó!',
            ], 401)->header('Cache-Control', 'no-store, private');
        }

        if ($user->is_banned) {
            $user->tokens()->delete();

            return response()->json([
                'message' => 'A felhasználói fiókod le van tiltva.',
            ], 403)->header('Cache-Control', 'no-store, private');
        }

        if (Hash::needsRehash($user->password)) {
            $user->password = $validated['password'];
            $user->save();
        }

        // Egy felhasználónak egyszerre csak a legutóbbi bearer tokenje marad aktív.
        $user->tokens()->delete();

        $token = $user->createToken(
            'auth_token',
            ['*'],
            now()->addMinutes((int) config('sanctum.expiration', 1440))
        )->plainTextToken;

        return $this->authResponse('Sikeres bejelentkezés!', $user, $token);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    public function logout(Request $request)
    {
        $token = $request->user()?->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        } else {
            $request->user()?->tokens()->delete();
        }

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Sikeres kijelentkezés.',
        ]);
    }

    private function authResponse(string $message, User $user, string $token, int $status = 200)
    {
        return response()->json([
            'message' => $message,
            'user' => $this->userPayload($user),
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => (int) config('sanctum.expiration', 1440) * 60,
        ], $status)->header('Cache-Control', 'no-store, private');
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'xp_points' => $user->xp_points,
            'current_streak' => $user->current_streak,
            'is_banned' => $user->is_banned,
            'created_at' => $user->created_at,
        ];
    }
}
