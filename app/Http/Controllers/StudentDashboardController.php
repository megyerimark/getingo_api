<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Note;
use Illuminate\Http\Request;

class StudentDashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $totalLessons = Lesson::count();
        $completedLessons = LessonProgress::where('user_id', $user->id)->count();
        
        // Százalékos haladás kiszámítása
        $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

        return response()->json([
            'user' => [
                'name' => $user->name,
                'xp_points' => $user->xp_points,
                'current_streak' => $user->current_streak,
            ],
            'stats' => [
                'progress_percentage' => $progressPercentage,
                'completed_lessons_count' => $completedLessons,
            ],
            'notes' => Note::where('user_id', $user->id)->get(),
            'favorites' => Favorite::where('user_id', $user->id)->get()
        ], 200);
    }
}
