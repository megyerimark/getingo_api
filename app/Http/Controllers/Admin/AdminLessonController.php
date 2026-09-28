<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminLessonController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(max($request->integer('per_page', 25), 1), 100);

        return response()->json(
            Lesson::query()->with('category:id,name,slug')->latest()->paginate($perPage)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());
        $lesson = Lesson::create($validated);

        AuditLogger::record($request, 'lesson.created', $lesson);

        return response()->json([
            'message' => 'A lecke sikeresen létrehozva!',
            'lesson' => $lesson,
        ], 201);
    }

    public function show(Lesson $lesson)
    {
        return response()->json($lesson->load('category:id,name,slug'));
    }

    public function update(Request $request, Lesson $lesson)
    {
        $validated = $request->validate($this->rules($lesson, true));
        $lesson->update($validated);

        AuditLogger::record($request, 'lesson.updated', $lesson, [
            'changed_fields' => array_keys($validated),
        ]);

        return response()->json([
            'message' => 'A lecke sikeresen frissítve!',
            'lesson' => $lesson->fresh(),
        ]);
    }

    public function destroy(Request $request, Lesson $lesson)
    {
        AuditLogger::record($request, 'lesson.deleted', $lesson);
        $lesson->delete();

        return response()->json([
            'message' => 'A lecke sikeresen törölve!',
        ]);
    }

    private function rules(?Lesson $lesson = null, bool $partial = false): array
    {
        $presence = $partial ? 'sometimes' : 'required';

        return [
            'category_id' => [$presence, 'integer', 'exists:categories,id'],
            'title' => [$presence, 'string', 'max:255'],
            'slug' => [
                $presence,
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('lessons', 'slug')->ignore($lesson?->id),
            ],
            'content' => [$presence, 'string', 'max:200000'],
            'example_code' => ['nullable', 'string', 'max:200000'],
        ];
    }
}
