<?php

use App\Http\Controllers\Admin\AdminAuditLogController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminExerciseController;
use App\Http\Controllers\Admin\AdminLessonController;
use App\Http\Controllers\Admin\AdminProjectController;
use App\Http\Controllers\Admin\AdminQuizController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\GdprController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\Student\LessonController;
use App\Http\Controllers\StudentDashboardController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AdminCategoryController;
use App\Http\Controllers\LessonCodeNoteController;

Route::middleware('throttle:public-api')->group(function () {
    Route::get('/kategoriak', [CategoryController::class, 'index']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category_id}/lessons', [LessonController::class, 'index'])
        ->whereNumber('category_id');
        Route::get('/lessons/{lessonId}/quizzes', [QuizController::class, 'byLesson'])
    ->whereNumber('lessonId');

Route::post('/quizzes/{quiz}/check', [QuizController::class, 'check'])
    ->whereNumber('quiz');

});

Route::get('/search', [SearchController::class, 'index'])
    ->middleware('throttle:search');

Route::post('/regisztracio', [AuthController::class, 'register'])
    ->middleware(['throttle:register', 'no-store']);

Route::post('/bejelentkezes', [AuthController::class, 'login'])
    ->middleware(['throttle:login', 'no-store']);

Route::middleware(['auth:sanctum', 'active', 'throttle:user-api', 'no-store'])->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', [StudentDashboardController::class, 'index']);
    Route::patch('/account', [AccountController::class, 'update']);
    Route::put('/account/password', [AccountController::class, 'changePassword'])
        ->middleware('throttle:gdpr');

    Route::apiResource('notes', NoteController::class);
    Route::post('/progress', [ProgressController::class, 'complete']);
    Route::post('/favorites/toggle', [FavoriteController::class, 'toggle']);
    Route::post('/quizzes/{quiz}/submit', [QuizController::class, 'submit'])
        ->middleware('throttle:quiz');

    Route::get('/gdpr/export', [GdprController::class, 'exportData'])
        ->middleware('throttle:gdpr');
    Route::delete('/gdpr/delete-account', [GdprController::class, 'deleteAccount'])
        ->middleware('throttle:gdpr');
    Route::get('/lessons/{lesson}/personal-code', [LessonCodeNoteController::class, 'show']);
    Route::put('/lessons/{lesson}/personal-code', [LessonCodeNoteController::class, 'update']);
    Route::delete('/lessons/{lesson}/personal-code', [LessonCodeNoteController::class, 'destroy']);
    Route::post('/quizzes/{quiz}/submit', [QuizController::class, 'submit'])
    ->middleware('throttle:quiz');
});

Route::middleware([
    'auth:sanctum',
    'active',
    'admin',
    'throttle:admin-api',
    'no-store',
])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/dashboard-stats', [AdminDashboardController::class, 'stats']);

    Route::get('/audit-logs', [AdminAuditLogController::class, 'index']);

    Route::get('/users', [AdminUserController::class, 'index']);
    Route::patch('/users/{id}/role', [AdminUserController::class, 'updateRole'])->whereNumber('id');
    Route::post('/users/{id}/toggle-ban', [AdminUserController::class, 'toggleBan'])->whereNumber('id');

    Route::apiResource('lessons', AdminLessonController::class);
    Route::apiResource('exercises', AdminExerciseController::class);
    Route::apiResource('projects', AdminProjectController::class);
    Route::apiResource('quizzes', AdminQuizController::class);
    Route::apiResource('categories', AdminCategoryController::class);
});
