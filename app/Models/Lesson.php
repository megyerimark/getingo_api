<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    
    protected $fillable = [
        'category_id',
        'title',
        'slug',
        'content',
        'example_code'
    ];
}
