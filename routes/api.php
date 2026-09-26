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




Route::get("/kategoriak", [CategoryController::class, "index"]);

//Publikus útvonalak
Route::post("/regisztracio", [AuthController::class, "register"]);
Route::post("/bejelentkezes", [AuthController::class, "login"]);
Route::get('/categories', [App\Http\Controllers\CategoryController::class, 'index']);
Route::get('/categories/{category_id}/lessons', [LessonController::class, 'index']);
Route::get('/search', [SearchController::class, 'index']);


// Sima bejelentkezett diákok végpontjai
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/notes', [NoteController::class, 'store']);
    Route::post('/progress', [ProgressController::class, 'complete']);
    Route::post('/favorites/toggle', [FavoriteController::class, 'toggle']);
    Route::post('/quizzes/{quiz}/submit', [QuizController::class, 'submit']);

});

// KIZÁRÓLAG ADMINISZTRÁTOROKNAK
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Példa: Cikkek / Leckék felvitele, módosítása, törlése
    // Route::post('/lessons', [AdminLessonController::class, 'store']);
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::post('/lessons', [AdminLessonController::class, 'store']);
    Route::post('/exercises', [AdminExerciseController::class, 'store']);
    Route::post('/projects', [AdminProjectController::class, 'store']);
    Route::post('/quizzes', [AdminQuizController::class, 'store']);
    Route::get('/dashboard-stats', [AdminDashboardController::class, 'stats']);
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::patch('/users/{id}/role', [AdminUserController::class, 'updateRole']);
    Route::post('/users/{id}/toggle-ban', [AdminUserController::class, 'toggleBan']);

});