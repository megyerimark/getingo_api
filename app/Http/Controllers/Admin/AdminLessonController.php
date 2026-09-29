<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminLessonController extends Controller
{
    public function index()
    {
        return response()->json(
            Lesson::with('category:id,name')
                ->orderBy('category_id')
                ->orderBy('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:lessons,slug'],
            'content' => ['required', 'string'],
            'example_code' => ['nullable', 'string'],
            'example_html' => ['nullable', 'string', 'max:100000'],
            'example_css' => ['nullable', 'string', 'max:100000'],
            'example_javascript' => ['nullable', 'string', 'max:100000']
        ]);

        $lesson = Lesson::create($validated);

        return response()->json([
            'message' => 'A lecke sikeresen létrehozva!',
            'lesson' => $lesson
        ], 201);
    }

    public function show(Lesson $lesson)
    {
        return response()->json(
            $lesson->load('category:id,name')
        );
    }

    public function update(Request $request, Lesson $lesson)
    {
        $validated = $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('lessons', 'slug')->ignore($lesson->id)
            ],
            'content' => ['required', 'string'],
            'example_code' => ['nullable', 'string'],
            'example_html' => ['nullable', 'string', 'max:100000'],
            'example_css' => ['nullable', 'string', 'max:100000'],
            'example_javascript' => ['nullable', 'string', 'max:100000']
        ]);

        $lesson->update($validated);

        return response()->json([
            'message' => 'A lecke sikeresen frissítve!',
            'lesson' => $lesson->fresh()
        ]);
    }

    public function destroy(Lesson $lesson)
    {
        $lesson->delete();

        return response()->json([
            'message' => 'A lecke sikeresen törölve!'
        ]);
    }
}