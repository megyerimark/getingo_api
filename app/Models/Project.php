<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'difficulty',
        'estimated_time',
        'solution',
    ];

    protected $hidden = [
        'solution',
    ];

    protected function casts(): array
    {
        return [
            'estimated_time' => 'integer',
        ];
    }
}
