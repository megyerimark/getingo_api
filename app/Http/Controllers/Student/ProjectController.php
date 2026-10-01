<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectSubmission;
use App\Services\CompanionService;
use App\Services\LearningExperienceService;
use App\Services\ProjectValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $projects = Project::query()
            ->select(
                'id',
                'title',
                'description',
                'difficulty',
                'estimated_time',
                'xp_reward',
                'created_at',
                'updated_at'
            )
            ->with(['submissions' => function ($query) use ($userId) {
                $query->where('user_id', $userId)
                    ->select('id', 'user_id', 'project_id', 'completed_at');
            }])
            ->latest('id')
            ->get()
            ->map(function (Project $project): array {
                $submission = $project->submissions->first();

                return [
                    'id' => $project->id,
                    'title' => $project->title,
                    'description' => $project->description,
                    'difficulty' => $project->difficulty,
                    'estimated_time' => $project->estimated_time,
                    'xp_reward' => $project->xp_reward,
                    'is_completed' => (bool) $submission?->completed_at,
                    'created_at' => $project->created_at,
                    'updated_at' => $project->updated_at,
                ];
            });

        return response()->json([
            'projects' => $projects,
        ]);
    }

    public function show(Request $request, Project $project, ProjectValidationService $validator): JsonResponse
    {
        $submission = ProjectSubmission::query()
            ->where('user_id', $request->user()->id)
            ->where('project_id', $project->id)
            ->first();

        return response()->json([
            'project' => [
                'id' => $project->id,
                'title' => $project->title,
                'description' => $project->description,
                'difficulty' => $project->difficulty,
                'estimated_time' => $project->estimated_time,
                'starter_html' => $project->starter_html ?? '',
                'starter_css' => $project->starter_css ?? '',
                'starter_javascript' => $project->starter_javascript ?? '',
                'validation_type' => $project->validation_type,
                'validation_configured' => filled($project->expected_output),
                'validation_trusted' => $validator->isTrustedType($project->validation_type),
                'xp_reward' => $project->xp_reward,
                'is_completed' => (bool) $submission?->completed_at,
                'created_at' => $project->created_at,
                'updated_at' => $project->updated_at,
            ],
            'submission' => $submission ? [
                'html_code' => $submission->html_code ?? '',
                'css_code' => $submission->css_code ?? '',
                'javascript_code' => $submission->javascript_code ?? '',
                'completed_at' => $submission->completed_at,
                'xp_awarded' => $submission->xp_awarded,
            ] : null,
        ]);
    }

    /**
     * A felhasználó saját, teljesített projektjei.
     * Az admin solution és expected_output mezők itt sem kerülnek ki az API-ból.
     */
    public function portfolio(Request $request): JsonResponse
    {
        $items = ProjectSubmission::query()
            ->where('user_id', $request->user()->id)
            ->whereNotNull('completed_at')
            ->with(['project:id,title,description,difficulty,estimated_time,xp_reward'])
            ->latest('completed_at')
            ->get()
            ->map(function (ProjectSubmission $submission): array {
                return [
                    'id' => $submission->id,
                    'project_id' => $submission->project_id,
                    'title' => $submission->project?->title ?? 'Projekt',
                    'description' => $submission->project?->description ?? '',
                    'difficulty' => $submission->project?->difficulty ?? '',
                    'estimated_time' => (int) ($submission->project?->estimated_time ?? 0),
                    'xp_awarded' => (int) $submission->xp_awarded,
                    'completed_at' => $submission->completed_at,
                    'html_code' => $submission->html_code ?? '',
                    'css_code' => $submission->css_code ?? '',
                    'javascript_code' => $submission->javascript_code ?? '',
                ];
            })
            ->values();

        return response()->json([
            'projects' => $items,
            'count' => $items->count(),
        ]);
    }

    public function saveWorkspace(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'html_code' => ['nullable', 'string', 'max:200000'],
            'css_code' => ['nullable', 'string', 'max:200000'],
            'javascript_code' => ['nullable', 'string', 'max:200000'],
        ]);

        $submission = ProjectSubmission::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'project_id' => $project->id,
            ],
            [
                'html_code' => $validated['html_code'] ?? '',
                'css_code' => $validated['css_code'] ?? '',
                'javascript_code' => $validated['javascript_code'] ?? '',
            ]
        );

        return response()->json([
            'message' => 'A projektmunkád elmentve.',
            'completed_at' => $submission->completed_at,
        ]);
    }

    public function check(
        Request $request,
        Project $project,
        CompanionService $companionService,
        LearningExperienceService $learningExperience,
        ProjectValidationService $validator
    ): JsonResponse {
        $validated = $request->validate([
            'console_output' => ['sometimes', 'array', 'max:200'],
            'console_output.*' => ['string', 'max:2000'],
            'html_code' => ['nullable', 'string', 'max:200000'],
            'css_code' => ['nullable', 'string', 'max:200000'],
            'javascript_code' => ['nullable', 'string', 'max:200000'],
        ]);

        if (! filled($project->expected_output)) {
            throw ValidationException::withMessages([
                'project' => 'Ehhez a projekthez az admin még nem állított be automatikus ellenőrzést.',
            ]);
        }

        $result = $validator->validate($project, $validated);
        $actual = $result['console_output'];

        $submission = ProjectSubmission::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'project_id' => $project->id,
            ],
            [
                'html_code' => $validated['html_code'] ?? '',
                'css_code' => $validated['css_code'] ?? '',
                'javascript_code' => $validated['javascript_code'] ?? '',
                'last_console_output' => implode("\n", $actual),
            ]
        );

        if (! $result['passed']) {
            return response()->json([
                'passed' => false,
                'verified' => (bool) $result['trusted'],
                'message' => 'Még nem teljesen jó. A Getingo Mentor segíthet megtalálni, hol csúszott el a megoldás.',
                'console_output' => $actual,
                'is_completed' => (bool) $submission->completed_at,
            ]);
        }

        // A böngésző által jelentett console_output nem tekinthető hiteles bizonyítéknak.
        // A konzolos ellenőrzés marad azonnali tanulói visszajelzés, de XP-t és
        // projekt-teljesítést kizárólag szerveroldalon ellenőrizhető szabály adhat.
        if (! $result['trusted']) {
            return response()->json([
                'passed' => true,
                'verified' => false,
                'message' => 'A böngészős ellenőrzés szerint jó a kimenet, de ez a régi ellenőrzéstípus nem ad XP-t. Az adminban állíts be szerveroldali HTML/CSS/JavaScript ellenőrzést.',
                'console_output' => $actual,
                'earned_xp' => 0,
                'already_completed' => (bool) $submission->completed_at,
                'completed_at' => $submission->completed_at,
                'is_completed' => (bool) $submission->completed_at,
                'xp_points' => (int) $request->user()->fresh()->xp_points,
                'unlocked_achievements' => [],
            ]);
        }

        $award = DB::transaction(function () use ($request, $project, $validated, $actual, $companionService): array {
            $submission = ProjectSubmission::query()
                ->where('user_id', $request->user()->id)
                ->where('project_id', $project->id)
                ->lockForUpdate()
                ->firstOrFail();

            $submission->html_code = $validated['html_code'] ?? '';
            $submission->css_code = $validated['css_code'] ?? '';
            $submission->javascript_code = $validated['javascript_code'] ?? '';
            $submission->last_console_output = implode("\n", $actual);

            if ($submission->completed_at) {
                $submission->save();

                return [
                    'earned_xp' => 0,
                    'already_completed' => true,
                    'completed_at' => $submission->completed_at,
                ];
            }

            $reward = max(0, (int) $project->xp_reward);
            $submission->completed_at = now();
            $submission->xp_awarded = $reward;
            $submission->save();

            if ($reward > 0) {
                $companionService->awardLearningPoints($request->user(), $reward);
            }

            return [
                'earned_xp' => $reward,
                'already_completed' => false,
                'completed_at' => $submission->completed_at,
            ];
        });

        $unlocked = $award['already_completed']
            ? []
            : $learningExperience->recordLearningActivity($request->user()->fresh());

        return response()->json([
            'passed' => true,
            'verified' => true,
            'message' => $award['already_completed']
                ? 'A projekt már korábban teljesítve lett. A megoldásod frissítve.'
                : 'Sikeres projekt! Megkaptad a jutalmat, Pixel is fejlődött, a projekt pedig bekerült a portfóliódba.',
            'earned_xp' => $award['earned_xp'],
            'already_completed' => $award['already_completed'],
            'completed_at' => $award['completed_at'],
            'is_completed' => true,
            'xp_points' => (int) $request->user()->fresh()->xp_points,
            'unlocked_achievements' => $unlocked,
        ]);
    }

}
