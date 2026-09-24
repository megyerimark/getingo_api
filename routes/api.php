<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AdminLessonController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Student\LessonController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;




Route::get("/kategoriak", [CategoryController::class, "index"]);

//Publikus útvonalak
Route::post("/regisztracio", [AuthController::class, "register"]);
Route::post("/bejelentkezes", [AuthController::class, "login"]);
Route::get('/categories', [App\Http\Controllers\CategoryController::class, 'index']);
Route::get('/categories/{category_id}/lessons', [LessonController::class, 'index']);


// Sima bejelentkezett diákok végpontjai
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();

    });
});

// KIZÁRÓLAG ADMINISZTRÁTOROKNAK
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Példa: Cikkek / Leckék felvitele, módosítása, törlése
    // Route::post('/lessons', [AdminLessonController::class, 'store']);
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::post('/leckek', [AdminLessonController::class, 'store']);

});