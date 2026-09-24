<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exercise;
use Illuminate\Http\Request;

class AdminExerciseController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'difficulty' => 'required|string', // pl. 'kezdő', 'haladó'
            'solution' => 'nullable|string',
        ]);

        $exercise = Exercise::create($validated);

        return response()->json([
            'message' => 'A feladat sikeresen létrehozva!',
            'exercise' => $exercise
        ], 201);
    }
}
