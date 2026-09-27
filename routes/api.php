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





group(function () {
    Route::get('search', [SearchController::class, 'index']);
    Route::get('kategoriak', [CategoryController::class, 'index']);
    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('categories/{category_id}/lessons', [LessonController::class, 'index']);
    
    Route::post('regisztracio', [AuthController::class, 'register']);
});

// 2. Szigorúbb limit a bejelentkezéshez brute-force támadások ellen (5 próbálkozás / perc)
Route::middleware(['throttle:5,1'])->group(function () {
    Route::post('bejelentkezes', [AuthController::class, 'login']);
});

// 3. Bejelentkezett diákok végpontjai
Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', function (Request $request) {
        return $request->user();
    });

    // Teljes CRUD a jegyzetekhez
    Route::apiResource('notes', NoteController::class);

    // Tanulási folyamat és interakciók
    Route::post('progress', [ProgressController::class, 'complete']);
    Route::post('favorites/toggle', [FavoriteController::class, 'toggle']);
    Route::post('quizzes/{quiz}/submit', [QuizController::class, 'submit']);

    // GDPR végpontok
    Route::get('gdpr/export', [GdprController::class, 'exportData']);
    Route::delete('gdpr/delete-account', [GdprController::class, 'deleteAccount']);
});

// 4. KIZÁRÓLAG ADMINISZTRÁTOROKNAK
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    
    // Vezérlőpult és statisztikák
    Route::get('dashboard', [AdminController::class, 'dashboard']);
    Route::get('dashboard-stats', [AdminDashboardController::class, 'stats']);
    
    // Felhasználókezelés
    Route::get('users', [AdminUserController::class, 'index']);
    Route::patch('users/{id}/role', [AdminUserController::class, 'updateRole']);
    Route::post('users/{id}/toggle-ban', [AdminUserController::class, 'toggleBan']);

    // Teljes CRUD az oktatási anyagokhoz
    Route::apiResource('lessons', AdminLessonController::class);
    Route::apiResource('exercises', AdminExerciseController::class);
    Route::apiResource('projects', AdminProjectController::class);
    Route::apiResource('quizzes', AdminQuizController::class);
});

/* Route::middleware(['throttle:60,1'])->group(function () {
    Route::get('/search', [SearchController::class, 'index']);
    Route::get("/kategoriak", [CategoryController::class, "index"]);

//Publikus útvonalak
Route::post("/regisztracio", [AuthController::class, "register"]);
Route::post("/bejelentkezes", [AuthController::class, "login"]);
Route::get('/categories', [App\Http\Controllers\CategoryController::class, 'index']);
Route::get('/categories/{category_id}/lessons', [LessonController::class, 'index']);
Route::get('/search', [SearchController::class, 'index']);

}); */
/* 


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

}); */