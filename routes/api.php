<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;




Route::get("/kategoriak", [CategoryController::class, "index"]);
Route::post("/regisztracio", [AuthController::class, "register"]);
