<?php

namespace App\Http\Controllers;

use App\Models\LessonProgress;
use Illuminate\Http\Request;
use App\Services\CompanionService;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    public function __construct(private CompanionService $companionService)
    {
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

            if ($progress->wasRecentlyCreated) {
                $this->companionService->awardLearningPoints($user, 1);
                $message = 'Lecke teljesítve! +10 XP és +10 gondozási pont';
            } else {
                if (!$progress->completed) {
                    $progress->update(['completed' => true]);
                    $this->companionService->awardLearningPoints($user, 1);
                    $message = 'Lecke teljesítve! +10 XP és +10 gondozási pont';
                } else {
                    $message = 'Ezt a leckét már korábban teljesítetted.';
                }
            }

            return [
                'message' => $message,
                'current_xp' => $user->fresh()->xp_points,
            ];
        });

        return response()->json($result);
    }
}
