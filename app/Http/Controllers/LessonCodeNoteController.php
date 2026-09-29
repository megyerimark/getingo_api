<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\LessonCodeNote;
use Illuminate\Http\Request;

class LessonCodeNoteController extends Controller
{
    public function show(Request $request, Lesson $lesson)
    {
        $personalCode = LessonCodeNote::where('user_id', $request->user()->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        return response()->json([
            'saved' => (bool) $personalCode,
            'html' => $personalCode?->html_code ?? $lesson->example_html ?? '',
            'css' => $personalCode?->css_code ?? $lesson->example_css ?? '',
            'javascript' => $personalCode?->javascript_code ?? $lesson->example_javascript ?? ''
        ]);
    }

    public function update(Request $request, Lesson $lesson)
    {
        $validated = $request->validate([
            'html' => 'present|nullable|string|max:100000',
            'css' => 'present|nullable|string|max:100000',
            'javascript' => 'present|nullable|string|max:100000'
        ]);

        $personalCode = LessonCodeNote::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'lesson_id' => $lesson->id
            ],
            [
                'html_code' => $validated['html'] ?? '',
                'css_code' => $validated['css'] ?? '',
                'javascript_code' => $validated['javascript'] ?? ''
            ]
        );

        return response()->json([
            'message' => 'Saját kód elmentve!',
            'saved' => true,
            'html' => $personalCode->html_code,
            'css' => $personalCode->css_code,
            'javascript' => $personalCode->javascript_code
        ]);
    }

    public function destroy(Request $request, Lesson $lesson)
    {
        LessonCodeNote::where('user_id', $request->user()->id)
            ->where('lesson_id', $lesson->id)
            ->delete();

        return response()->json([
            'message' => 'Saját kód visszaállítva az eredetire.',
            'saved' => false,
            'html' => $lesson->example_html ?? '',
            'css' => $lesson->example_css ?? '',
            'javascript' => $lesson->example_javascript ?? ''
        ]);
    }
}