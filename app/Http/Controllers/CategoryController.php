<?php

namespace App\Http\Controllers;

use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(
            Category::query()
                ->select('id', 'name', 'slug', 'sort_order')
                ->withCount(['lessons', 'lessonSections'])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }
}
