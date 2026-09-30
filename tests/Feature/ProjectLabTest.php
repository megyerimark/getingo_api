<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectLabTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_project_does_not_expose_solution_or_expected_output(): void
    {
        $user = User::factory()->create();
        $project = Project::create([
            'title' => 'JS változó',
            'description' => 'Írj ki két értéket.',
            'difficulty' => 'kezdő',
            'estimated_time' => 15,
            'solution' => 'SECRET_SOLUTION',
            'starter_javascript' => 'let value = 18;',
            'validation_type' => 'console_exact',
            'expected_output' => "18\n19",
            'xp_reward' => 30,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/projects/'.$project->id)
            ->assertOk()
            ->assertJsonPath('project.validation_configured', true)
            ->assertJsonPath('project.xp_reward', 30);

        $this->assertStringNotContainsString('SECRET_SOLUTION', $response->getContent());
        $this->assertStringNotContainsString('18\\n19', $response->getContent());
    }

    public function test_project_can_be_saved_and_completed_only_once_for_xp(): void
    {
        $user = User::factory()->create(['xp_points' => 0]);
        $project = Project::create([
            'title' => 'Console projekt',
            'description' => 'Kimenet ellenőrzés',
            'difficulty' => 'kezdő',
            'estimated_time' => 20,
            'validation_type' => 'console_exact',
            'expected_output' => "18\n19",
            'xp_reward' => 40,
        ]);

        Sanctum::actingAs($user);

        $this->putJson('/api/projects/'.$project->id.'/workspace', [
            'javascript_code' => 'console.log(18); console.log(19);',
        ])->assertOk();

        $this->postJson('/api/projects/'.$project->id.'/check', [
            'javascript_code' => 'console.log(18); console.log(19);',
            'console_output' => ['18', '19'],
        ])->assertOk()
            ->assertJsonPath('passed', true)
            ->assertJsonPath('earned_xp', 40);

        $this->assertSame(40, (int) $user->fresh()->xp_points);
        $this->assertNotNull(ProjectSubmission::first()->completed_at);

        $this->postJson('/api/projects/'.$project->id.'/check', [
            'javascript_code' => 'console.log(18); console.log(19);',
            'console_output' => ['18', '19'],
        ])->assertOk()
            ->assertJsonPath('passed', true)
            ->assertJsonPath('earned_xp', 0)
            ->assertJsonPath('already_completed', true);

        $this->assertSame(40, (int) $user->fresh()->xp_points);
    }

    public function test_wrong_console_output_does_not_complete_project(): void
    {
        $user = User::factory()->create(['xp_points' => 0]);
        $project = Project::create([
            'title' => 'Hibás kimenet',
            'description' => 'Teszt',
            'difficulty' => 'kezdő',
            'estimated_time' => 10,
            'validation_type' => 'console_exact',
            'expected_output' => 'OK',
            'xp_reward' => 20,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/projects/'.$project->id.'/check', [
            'console_output' => ['NOPE'],
        ])->assertOk()
            ->assertJsonPath('passed', false);

        $this->assertSame(0, (int) $user->fresh()->xp_points);
        $this->assertNull(ProjectSubmission::first()->completed_at);
    }
}
