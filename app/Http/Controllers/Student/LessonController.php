<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function index($categoryId)
    {
        // Lekéri az összes leckét, ami az adott kategóriához tartozik
        $lessons = Lesson::where('category_id', $categoryId)->get();
        
        return response()->json($lessons, 200);
    }
}
