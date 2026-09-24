<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class NoteController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'lesson_id' => 'required|exists:lessons,id',
            'content' => 'required|string',
        ]);

        // A diák ID-ját a tokenből nyerjük ki (auth()->id()), nem a beküldött adatokból!
        $note = Note::updateOrCreate(
            ['user_id' => auth()->id(), 'lesson_id' => $request->lesson_id],
            ['content' => $request->content]
        );

        return response()->json([
            'message' => 'Jegyzet mentve!',
            'note' => $note
        ], 200);
    }
}
