<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCompanion extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'care_points',
        'water',
        'hunger',
        'happiness',
        'selected_skin',
        'last_interaction_at',
    ];

    protected function casts(): array
    {
        return [
            'care_points' => 'integer',
            'water' => 'integer',
            'hunger' => 'integer',
            'happiness' => 'integer',
            'last_interaction_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
