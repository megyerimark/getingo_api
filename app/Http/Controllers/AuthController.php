<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request){
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string|min:8'
        ],
        ([
        "name" => "Név kötelező",
        "email" => "Email",
        "password" => "minimum 8 karakter",
        ]));
        $user = User::create([
            'name'=>$validated['name'],
            'email'=>$validated['email'],
            "password"=>Hash::make($validated["password"]),
        ]);

        $token = $user->createToken("auth_token")->plainTextToken;
        return response()->json([
            'message' => 'Sikeres regisztráció!',
            'user' => $user,
            'access_token' => $token,
        ], 201);
    }

    public function login(Request $request){
        $request->validate([
            
            'email' => 'required|string|email',
            'password' => 'required|string'
            ],
            ([
        "email" => "email kötelező",
        "password" => "jelszó kötelező",
        ]));

        $user = User::where('email', $request->email)->first();

        //Jelszó ellenőrzése

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Hibás email vagy jelszó!'
            ], 401); // 401 = Unauthorized (Jogosulatlan)
        }

        // 4. Új token generálása
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Sikeres bejelentkezés!',
            'user' => $user,
            'access_token' => $token,
        ], 200);
}
}
