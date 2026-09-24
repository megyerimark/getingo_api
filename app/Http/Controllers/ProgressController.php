<?php

namespace App\Http\Controllers;

use App\Models\LessonProgress;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
class ProgressController extends Controller
{
    public function complete(Request $request)
    {
        $request->validate([
            'lesson_id' => 'required|exists:lessons,id'
        ]);

        $progress = LessonProgress::updateOrCreate(
            ['user_id' => auth()->id(), 'lesson_id' => $request->lesson_id],
            ['completed' => true]
        );

        return response()->json([
            'message' => 'Lecke sikeresen teljesítve!',
            'progress' => $progress
        ], 200);
    }
}
