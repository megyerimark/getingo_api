<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminExerciseController;
use App\Http\Controllers\Admin\AdminLessonController;
use App\Http\Controllers\Admin\AdminProjectController;
use App\Http\Controllers\Admin\AdminQuizController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\Student\LessonController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::middleware('throttle:60,1')->group(function () {

    Route::get('/search', [SearchController::class, 'index']);
    Route::get('/kategoriak', [CategoryController::class, 'index']);
    Route::get('/categories', [CategoryController::class, 'index']);

    Route::get(
        '/categories/{category_id}/lessons',
        [LessonController::class, 'index']
    )->whereNumber('category_id');

});


Route::middleware('throttle:5,1')->group(function () {

    Route::post('/regisztracio', [AuthController::class, 'register']);
    Route::post('/bejelentkezes', [AuthController::class, 'login']);

});


Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('notes', NoteController::class);

    Route::post('/progress', [ProgressController::class, 'complete']);
    Route::post('/favorites/toggle', [FavoriteController::class, 'toggle']);
    Route::post('/quizzes/{quiz}/submit', [QuizController::class, 'submit']);

});


Route::middleware(['auth:sanctum', 'admin'])
    ->prefix('admin')
    ->group(function () {

        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/dashboard-stats', [AdminDashboardController::class, 'stats']);

        Route::get('/users', [AdminUserController::class, 'index']);
        Route::patch('/users/{id}/role', [AdminUserController::class, 'updateRole'])
            ->whereNumber('id');
        Route::post('/users/{id}/toggle-ban', [AdminUserController::class, 'toggleBan'])
            ->whereNumber('id');

        Route::apiResource('lessons', AdminLessonController::class);
        Route::apiResource('exercises', AdminExerciseController::class);
        Route::apiResource('projects', AdminProjectController::class);
        Route::apiResource('quizzes', AdminQuizController::class);

    });