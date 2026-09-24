<?php

namespace App\Http\Controllers;

use App\Models\LessonProgress;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
class ProgressController extends Controller
{
 /*    public function complete(Request $request)
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
    } */
    public function complete(Request $request)
    {
        $request->validate(['lesson_id' => 'required|exists:lessons,id']);
        $user = auth()->user();

        // A firstOrCreate megnézi, hogy létezik-e. Ha nem, létrehozza és visszaadja.
        $progress = LessonProgress::firstOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $request->lesson_id],
            ['completed' => true]
        );

        // A wasRecentlyCreated tulajdonság csak akkor igaz, ha most jött létre az adatbázisban
        if ($progress->wasRecentlyCreated) {
            $user->increment('xp_points', 10); // Adunk 10 XP-t
            $message = 'Lecke teljesítve! +10 XP';
        } else {
            $message = 'Ezt a leckét már korábban teljesítetted.';
        }

        return response()->json([
            'message' => $message,
            'current_xp' => $user->xp_points
        ], 200);
    }
}
