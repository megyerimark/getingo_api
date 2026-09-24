<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class AdminProjectController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'difficulty' => 'required|string',
            'estimated_time' => 'required|integer|min:1', // percben megadva
            'solution' => 'nullable|string',
        ]);

        $project = Project::create($validated);

        return response()->json([
            'message' => 'A projekt sikeresen létrehozva!',
            'project' => $project
        ], 201);
    }
}
