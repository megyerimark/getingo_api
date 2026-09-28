<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class AdminProjectController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(max($request->integer('per_page', 25), 1), 100);
        $items = Project::query()->latest()->paginate($perPage);
        $items->getCollection()->transform(fn (Project $project) => $project->makeVisible('solution'));

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());
        $project = Project::create($validated)->makeVisible('solution');

        AuditLogger::record($request, 'project.created', $project);

        return response()->json([
            'message' => 'A projekt sikeresen létrehozva!',
            'project' => $project,
        ], 201);
    }

    public function show(Project $project)
    {
        return response()->json($project->makeVisible('solution'));
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate($this->rules(true));
        $project->update($validated);

        AuditLogger::record($request, 'project.updated', $project, [
            'changed_fields' => array_keys($validated),
        ]);

        return response()->json([
            'message' => 'A projekt sikeresen frissítve!',
            'project' => $project->fresh()->makeVisible('solution'),
        ]);
    }

    public function destroy(Request $request, Project $project)
    {
        AuditLogger::record($request, 'project.deleted', $project);
        $project->delete();

        return response()->json([
            'message' => 'A projekt sikeresen törölve!',
        ]);
    }

    private function rules(bool $partial = false): array
    {
        $presence = $partial ? 'sometimes' : 'required';

        return [
            'title' => [$presence, 'string', 'max:255'],
            'description' => [$presence, 'string', 'max:100000'],
            'difficulty' => [$presence, 'string', 'max:50'],
            'estimated_time' => [$presence, 'integer', 'min:1', 'max:10080'],
            'solution' => ['nullable', 'string', 'max:200000'],
        ];
    }
}
