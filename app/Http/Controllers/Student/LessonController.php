<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Lesson;

class LessonController extends Controller
{
    public function index(int $category_id)
    {
        Category::findOrFail($category_id);

        $lessons = Lesson::query()
            ->where('category_id', $category_id)
            ->select('id', 'category_id', 'title', 'slug', 'content', 'example_code', 'created_at', 'updated_at')
            ->orderBy('id')
            ->get();

        return response()->json($lessons);
    }
}
