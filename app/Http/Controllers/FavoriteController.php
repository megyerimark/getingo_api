<?php

namespace App\Http\Controllers;

use App\Models\Favorite;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function toggle(Request $request)
    {
        $request->validate(['lesson_id' => 'required|exists:lessons,id']);

        $favorite = Favorite::where('user_id', auth()->id())
                            ->where('lesson_id', $request->lesson_id)
                            ->first();

        if ($favorite) {
            $favorite->delete();
            return response()->json(['message' => 'Eltávolítva a kedvencek közül!'], 200);
        }

        Favorite::create([
            'user_id' => auth()->id(),
            'lesson_id' => $request->lesson_id
        ]);

        return response()->json(['message' => 'Hozzáadva a kedvencekhez!'], 201);
    }
}
