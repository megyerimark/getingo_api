<?php

namespace App\Http\Controllers;

use App\Models\LessonProgress;
use App\Services\CompanionService;
use App\Services\LearningExperienceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    public function __construct(
        private CompanionService $companionService,
        private LearningExperienceService $learningExperience
    ) {
    }

    public function complete(Request $request)
    {
        $validated = $request->validate([
            'lesson_id' => ['required', 'integer', 'exists:lessons,id'],
        ]);

        $user = $request->user();

        $result = DB::transaction(function () use ($user, $validated): array {
            $progress = LessonProgress::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'lesson_id' => $validated['lesson_id'],
                ],
                ['completed' => true]
            );

            $newCompletion = false;

            if ($progress->wasRecentlyCreated) {
                $this->companionService->awardLearningPoints($user, 10);
                $message = 'Lecke teljesítve! +10 XP';
                $newCompletion = true;
            } elseif (! $progress->completed) {
                $progress->update(['completed' => true]);
                $this->companionService->awardLearningPoints($user, 10);
                $message = 'Lecke teljesítve! +10 XP';
                $newCompletion = true;
            } else {
                $message = 'Ezt a leckét már korábban teljesítetted.';
            }

            $unlocked = $newCompletion
                ? $this->learningExperience->recordLearningActivity($user->fresh())
                : [];

            return [
                'message' => $message,
                'current_xp' => $user->fresh()->xp_points,
                'unlocked_achievements' => $unlocked,
            ];
        });

        return response()->json($result);
    }
}
