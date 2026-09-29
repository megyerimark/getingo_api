<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Lesson;
use App\Models\User;
use App\Models\UserCompanion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CompanionTest extends TestCase
{
    use RefreshDatabase;

    public function test_companion_is_created_from_existing_xp(): void
    {
        $user = User::factory()->create(['xp_points' => 120]);
        Sanctum::actingAs($user);

        $this->getJson('/api/companion')
            ->assertOk()
            ->assertJsonPath('companion.care_points', 120)
            ->assertJsonPath('growth.key', 'sprout')
            ->assertJsonPath('growth.level', 2)
            ->assertJsonPath('growth.knowledge_growth_points', 60)
            ->assertJsonPath('growth.care_growth_points', 0);
    }

    public function test_completing_a_lesson_awards_xp_and_care_points_once(): void
    {
        $category = Category::create([
            'name' => 'JavaScript',
            'slug' => 'javascript',
            'sort_order' => 1,
        ]);

        $lesson = Lesson::create([
            'category_id' => $category->id,
            'title' => 'Első lecke',
            'slug' => 'elso-lecke',
            'content' => 'Tartalom',
        ]);

        $user = User::factory()->create(['xp_points' => 0]);
        Sanctum::actingAs($user);

        $this->postJson('/api/progress', ['lesson_id' => $lesson->id])->assertOk();
        $this->postJson('/api/progress', ['lesson_id' => $lesson->id])->assertOk();

        $this->assertSame(10, $user->fresh()->xp_points);
        $this->assertSame(10, UserCompanion::where('user_id', $user->id)->value('care_points'));
    }

    public function test_companion_action_spends_points_improves_meter_and_adds_growth(): void
    {
        $user = User::factory()->create(['xp_points' => 100]);
        $companion = UserCompanion::create([
            'user_id' => $user->id,
            'care_points' => 60,
            'growth_points' => 0,
            'water' => 40,
            'hunger' => 70,
            'happiness' => 70,
            'last_decay_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/companion/action', ['action' => 'water'])
            ->assertOk()
            ->assertJsonPath('state.companion.care_points', 40)
            ->assertJsonPath('state.companion.water', 70)
            ->assertJsonPath('state.companion.growth_points', 12)
            ->assertJsonPath('state.growth.care_growth_points', 12);

        $companion->refresh();
        $this->assertSame(40, $companion->care_points);
        $this->assertSame(70, $companion->water);
        $this->assertSame(12, $companion->growth_points);
    }

    public function test_caring_can_unlock_the_next_visual_stage(): void
    {
        $user = User::factory()->create(['xp_points' => 0]);
        UserCompanion::create([
            'user_id' => $user->id,
            'care_points' => 100,
            'growth_points' => 38,
            'water' => 40,
            'hunger' => 70,
            'happiness' => 70,
            'last_decay_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/companion/action', ['action' => 'water'])
            ->assertOk()
            ->assertJsonPath('state.growth.key', 'sprout')
            ->assertJsonPath('state.growth.total_growth_points', 50);
    }

    public function test_companion_stats_slowly_decay_but_never_drop_below_minimum(): void
    {
        $user = User::factory()->create(['xp_points' => 0]);
        UserCompanion::create([
            'user_id' => $user->id,
            'care_points' => 0,
            'growth_points' => 0,
            'water' => 70,
            'hunger' => 70,
            'happiness' => 70,
            'last_decay_at' => now()->subHours(12),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/companion')
            ->assertOk()
            ->assertJsonPath('companion.water', 62)
            ->assertJsonPath('companion.hunger', 64)
            ->assertJsonPath('companion.happiness', 66);
    }
}
