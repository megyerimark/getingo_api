<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Exercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'title',
        'description',
        'difficulty',
        'solution',
    ];

    protected $hidden = [
        'solution',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
