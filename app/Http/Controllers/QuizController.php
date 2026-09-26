<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizCompletion;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function submit(Request $request, $quizId)
    {
        $request->validate(['answer' => 'required|in:a,b,c,d']);
        $quiz = Quiz::findOrFail($quizId);
        $user = auth()->user();

        if ($request->answer !== $quiz->correct_answer) {
            return response()->json(['message' => 'Helytelen válasz, próbáld újra!', 'correct' => false], 200);
        }

        $completion = QuizCompletion::firstOrCreate([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id
        ]);

        if ($completion->wasRecentlyCreated) {
            $user->increment('xp_points', 5); // +5 XP a sikeres kvízért
            return response()->json(['message' => 'Helyes válasz! +5 XP', 'correct' => true], 200);
        }

        return response()->json(['message' => 'Helyes válasz! (Már korábban megoldottad)', 'correct' => true], 200);
    }
}
