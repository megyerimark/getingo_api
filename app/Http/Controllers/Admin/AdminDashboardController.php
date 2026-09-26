<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LessonProgress;
use App\Models\QuizCompletion;
use App\Models\User;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function stats()
    {
        $totalUsers = User::count();
        $adminUsers = User::where('role', 'admin')->count();
        $studentUsers = User::where('role', 'student')->count();
        $bannedUsers = User::where('is_banned', true)->count();

        $totalLessonsCompleted = LessonProgress::where('completed', true)->count();
        $totalQuizzesPassed = QuizCompletion::count();

        return response()->json([
            'users' => [
                'total' => $totalUsers,
                'admins' => $adminUsers,
                'students' => $studentUsers,
                'banned' => $bannedUsers
            ],
            'learning_stats' => [
                'lessons_completed' => $totalLessonsCompleted,
                'quizzes_passed' => $totalQuizzesPassed
            ]
        ], 200);
    }
}
