<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LessonProgress;
use App\Models\QuizCompletion;
use App\Models\User;

class AdminDashboardController extends Controller
{
    public function stats()
    {
        return response()->json([
            'users' => [
                'total' => User::count(),
                'admins' => User::where('role', 'admin')->count(),
                'students' => User::where('role', 'student')->count(),
                'banned' => User::where('is_banned', true)->count(),
            ],
            'learning_stats' => [
                'lessons_completed' => LessonProgress::where('completed', true)->count(),
                'quizzes_passed' => QuizCompletion::count(),
            ],
        ]);
    }
}
