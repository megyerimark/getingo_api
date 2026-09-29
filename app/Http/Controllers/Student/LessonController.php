<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Lesson;

class LessonController extends Controller
{
 public function index($categoryId)
    {
        $lessons = Lesson::where('category_id', $categoryId)
            ->orderBy('id')
            ->get()
            ->map(function ($lesson) {
                return [
                    'id' => $lesson->id,
                    'category_id' => $lesson->category_id,
                    'title' => $lesson->title,
                    'slug' => $lesson->slug,
                    'content' => $lesson->content,
                    'example_code' => $lesson->example_code,
                    'example_html' => $lesson->example_html,
                    'example_css' => $lesson->example_css,
                    'example_javascript' => $lesson->example_javascript
                ];
            });

        return response()->json($lessons);
    }
        
}
