<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizCompletion extends Model
{
    protected $fillable = ['user_id', 'quiz_id'];
}
