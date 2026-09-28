<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Note;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $totalLessons = Lesson::count();
        $completedLessons = LessonProgress::where('user_id', $user->id)
            ->where('completed', true)
            ->count();

        $progressPercentage = $totalLessons > 0
            ? round(($completedLessons / $totalLessons) * 100)
            : 0;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'xp_points' => $user->xp_points,
                'current_streak' => $user->current_streak,
            ],
            'stats' => [
                'progress_percentage' => $progressPercentage,
                'completed_lessons_count' => $completedLessons,
                'total_lessons_count' => $totalLessons,
            ],
            'notes' => Note::where('user_id', $user->id)
                ->latest()
                ->limit(20)
                ->get(),
            'favorites' => Favorite::where('user_id', $user->id)
                ->latest()
                ->limit(20)
                ->get(),
        ]);
    }
}
