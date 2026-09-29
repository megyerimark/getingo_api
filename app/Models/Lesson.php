<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = [
        'category_id',
        'title',
        'slug',
        'content',
        'example_code',
        'example_html',
        'example_css',
        'example_javascript'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }
}