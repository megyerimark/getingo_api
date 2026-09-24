<?php

namespace App\Http\Controllers\Admin;;

use App\Models\Lesson;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class AdminLessonController extends Controller
{
    public function store(Request $request)
    {
        // 1. Beérkező adatok szigorú ellenőrzése
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id', // Csak létező kategóriába tehetjük
            'title' => 'required|string|max:255',
            'slug' => 'required|string|unique:lessons',
            'content' => 'required|string',
            'example_code' => 'nullable|string',
        ]);

        // 2. Lecke létrehozása és mentése az adatbázisba
        $lesson = Lesson::create($validated);

        // 3. Sikeres válasz visszaküldése
        return response()->json([
            'message' => 'A lecke sikeresen létrehozva!',
            'lesson' => $lesson
        ], 201);
    }
}
