<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizCompletion;
use App\Services\CompanionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    public function __construct(private CompanionService $companionService)
    {
    }

    public function byLesson($lessonId)
    {
        $quizzes = Quiz::where('lesson_id', $lessonId)
            ->select(
                'id',
                'lesson_id',
                'question',
                'option_a',
                'option_b',
                'option_c',
                'option_d'
            )
            ->get();

        return response()->json($quizzes);
    }

    public function check(Request $request, Quiz $quiz)
    {
        $validated = $request->validate([
            'answer' => 'required|in:a,b,c,d'
        ]);

        $correct = $validated['answer'] === $quiz->correct_answer;

        return response()->json([
            'correct' => $correct,
            'message' => $correct
                ? 'Helyes válasz!'
                : 'Helytelen válasz, próbáld újra!'
        ]);
    }

    public function submit(Request $request, Quiz $quiz)
    {
        $validated = $request->validate([
            'answer' => 'required|in:a,b,c,d'
        ]);

        if ($validated['answer'] !== $quiz->correct_answer) {
            return response()->json([
                'correct' => false,
                'message' => 'Helytelen válasz, próbáld újra!'
            ]);
        }

        $user = $request->user();

        $result = DB::transaction(function () use ($user, $quiz): array {
            $completion = QuizCompletion::firstOrCreate([
                'user_id' => $user->id,
                'quiz_id' => $quiz->id
            ]);

            if ($completion->wasRecentlyCreated) {
                $this->companionService->awardLearningPoints($user, 1);

                return [
                    'correct' => true,
                    'message' => 'Helyes válasz! +1 XP és +1gondozási pont',
                    'xp_awarded' => 1,
                    'care_points_awarded' => 1,
                    'current_xp' => $user->fresh()->xp_points,
                ];
            }

            return [
                'correct' => true,
                'message' => 'Helyes válasz! Ezt a kvízt már korábban teljesítetted.',
                'xp_awarded' => 0,
                'care_points_awarded' => 0,
                'current_xp' => $user->fresh()->xp_points,
            ];
        });

        return response()->json($result);
    }
}
