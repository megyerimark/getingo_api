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
            'code' => $personalCode?->code ?? $lesson->example_code ?? '',
            'updated_at' => $personalCode?->updated_at
        ]);
    }

    public function update(Request $request, Lesson $lesson)
    {
        $validated = $request->validate([
            'code' => 'present|nullable|string|max:100000'
        ]);

        $personalCode = LessonCodeNote::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'lesson_id' => $lesson->id
            ],
            [
                'code' => $validated['code'] ?? ''
            ]
        );

        return response()->json([
            'message' => 'Saját kód elmentve!',
            'code' => $personalCode->code,
            'saved' => true
        ]);
    }

    public function destroy(Request $request, Lesson $lesson)
    {
        LessonCodeNote::where('user_id', $request->user()->id)
            ->where('lesson_id', $lesson->id)
            ->delete();

        return response()->json([
            'message' => 'Saját kód visszaállítva az eredetire.',
            'code' => $lesson->example_code ?? '',
            'saved' => false
        ]);
    }
}