<?php

namespace App\Http\Controllers;

use App\Services\CompanionService;
use Illuminate\Http\Request;

class CompanionController extends Controller
{
    public function __construct(private CompanionService $companionService)
    {
    }

    public function show(Request $request)
    {
        return response()->json(
            $this->companionService->state($request->user())
        );
    }

    public function action(Request $request)
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:water,feed,play'],
        ]);

        return response()->json(
            $this->companionService->performAction(
                $request->user(),
                $validated['action']
            )
        );
    }
}
