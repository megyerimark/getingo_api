<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserCompanion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CompanionService
{
    private const DECAY_INTERVAL_HOURS = 6;
    private const MIN_STAT = 25;

    private const ACTIONS = [
        'water' => [
            'field' => 'water',
            'cost' => 20,
            'boost' => 30,
            'growth' => 12,
            'label' => 'Öntözés',
            'message' => 'Kódmag felfrissült a víztől és egy kicsit növekedett.',
        ],
        'feed' => [
            'field' => 'hunger',
            'cost' => 30,
            'boost' => 30,
            'growth' => 15,
            'label' => 'Etetés',
            'message' => 'Kódmag jóllakott, és új energiát kapott a növekedéshez.',
        ],
        'play' => [
            'field' => 'happiness',
            'cost' => 25,
            'boost' => 25,
            'growth' => 10,
            'label' => 'Játék',
            'message' => 'Kódmag jobb kedvre derült és ragyogóbb lett.',
        ],
    ];

    public function getOrCreate(User $user): UserCompanion
    {
        return UserCompanion::firstOrCreate(
            ['user_id' => $user->id],
            [
                'name' => 'Kódmag',
                'care_points' => max(0, (int) $user->xp_points),
                'growth_points' => 0,
                'water' => 70,
                'hunger' => 70,
                'happiness' => 70,
                'selected_skin' => 'azure-sprout',
                'last_decay_at' => now(),
            ]
        );
    }

    public function awardLearningPoints(User $user, int $points): void
    {
        if ($points <= 0) {
            return;
        }

        $companion = $this->getOrCreate($user);
        $companion->increment('care_points', $points);
        $user->increment('xp_points', $points);
    }

    public function performAction(User $user, string $action): array
    {
        if (!array_key_exists($action, self::ACTIONS)) {
            throw ValidationException::withMessages([
                'action' => 'Ismeretlen gondozási művelet.',
            ]);
        }

        return DB::transaction(function () use ($user, $action): array {
            $config = self::ACTIONS[$action];
            $companion = $this->getOrCreate($user);
            $companion = UserCompanion::whereKey($companion->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->applyDecay($companion);

            $field = $config['field'];
            $currentValue = (int) $companion->{$field};
            $cost = (int) $config['cost'];

            if ($currentValue >= 100) {
                throw ValidationException::withMessages([
                    'action' => 'Ez az érték már maximumon van. Később újra gondozhatod.',
                ]);
            }

            if ($companion->care_points < $cost) {
                throw ValidationException::withMessages([
                    'action' => 'Nincs elég gondozási pontod ehhez.',
                ]);
            }

            $companion->care_points -= $cost;
            $companion->{$field} = min(100, $currentValue + (int) $config['boost']);
            $companion->growth_points += (int) $config['growth'];
            $companion->last_interaction_at = now();
            $companion->last_decay_at = now();
            $companion->save();

            return [
                'message' => $config['message'],
                'state' => $this->state($user->fresh(), $companion->fresh()),
            ];
        });
    }

    public function state(User $user, ?UserCompanion $companion = null): array
    {
        $companion ??= $this->getOrCreate($user);
        $this->applyDecay($companion);
        $companion->refresh();

        $xp = (int) $user->xp_points;
        $knowledgeGrowth = intdiv($xp, 2);
        $careGrowth = (int) $companion->growth_points;
        $totalGrowth = $knowledgeGrowth + $careGrowth;
        $stage = $this->stageForGrowth($totalGrowth, $knowledgeGrowth, $careGrowth);
        $mood = $this->moodForCompanion($companion);

        return [
            'companion' => [
                'id' => $companion->id,
                'name' => $companion->name,
                'care_points' => $companion->care_points,
                'growth_points' => $companion->growth_points,
                'water' => $companion->water,
                'hunger' => $companion->hunger,
                'happiness' => $companion->happiness,
                'selected_skin' => $companion->selected_skin,
                'last_interaction_at' => $companion->last_interaction_at,
            ],
            'growth' => $stage,
            'mood' => $mood,
            'xp_points' => $xp,
            'actions' => collect(self::ACTIONS)
                ->map(fn (array $config, string $key) => [
                    'key' => $key,
                    'label' => $config['label'],
                    'cost' => $config['cost'],
                    'boost' => $config['boost'],
                    'growth' => $config['growth'],
                ])
                ->values(),
        ];
    }

    private function applyDecay(UserCompanion $companion): void
    {
        if (!$companion->last_decay_at) {
            $companion->last_decay_at = now();
            $companion->save();
            return;
        }

        $minutesPassed = (int) $companion->last_decay_at->diffInMinutes(now());
        $periods = intdiv($minutesPassed, self::DECAY_INTERVAL_HOURS * 60);

        if ($periods <= 0) {
            return;
        }

        $periods = min($periods, 40);
        $companion->water = max(self::MIN_STAT, (int) $companion->water - ($periods * 4));
        $companion->hunger = max(self::MIN_STAT, (int) $companion->hunger - ($periods * 3));
        $companion->happiness = max(self::MIN_STAT, (int) $companion->happiness - ($periods * 2));
        $companion->last_decay_at = now();
        $companion->save();
    }

    private function stageForGrowth(int $points, int $knowledgeGrowth, int $careGrowth): array
    {
        $stages = [
            ['key' => 'seed', 'level' => 1, 'name' => 'Kódmag', 'min' => 0, 'next' => 50],
            ['key' => 'sprout', 'level' => 2, 'name' => 'Kis hajtás', 'min' => 50, 'next' => 150],
            ['key' => 'budding', 'level' => 3, 'name' => 'Bimbózó Kódvirág', 'min' => 150, 'next' => 300],
            ['key' => 'bloom', 'level' => 4, 'name' => 'Virágzó Kódvirág', 'min' => 300, 'next' => 600],
            ['key' => 'legendary', 'level' => 5, 'name' => 'Legendás Kódvirág', 'min' => 600, 'next' => null],
        ];

        $current = $stages[0];

        foreach ($stages as $stage) {
            if ($points >= $stage['min']) {
                $current = $stage;
            }
        }

        if ($current['next'] === null) {
            $progress = 100;
            $pointsToNext = 0;
        } else {
            $range = $current['next'] - $current['min'];
            $progress = (int) floor((($points - $current['min']) / $range) * 100);
            $progress = max(0, min(100, $progress));
            $pointsToNext = max(0, $current['next'] - $points);
        }

        return [
            'key' => $current['key'],
            'level' => $current['level'],
            'name' => $current['name'],
            'progress_percentage' => $progress,
            'next_stage_points' => $current['next'],
            'points_to_next_stage' => $pointsToNext,
            'knowledge_growth_points' => $knowledgeGrowth,
            'care_growth_points' => $careGrowth,
            'total_growth_points' => $points,
        ];
    }

    private function moodForCompanion(UserCompanion $companion): array
    {
        $score = (int) round(
            ((int) $companion->water + (int) $companion->hunger + (int) $companion->happiness) / 3
        );

        if ($score >= 85) {
            return ['key' => 'radiant', 'name' => 'Ragyogó', 'score' => $score];
        }

        if ($score >= 65) {
            return ['key' => 'happy', 'name' => 'Boldog', 'score' => $score];
        }

        if ($score >= 45) {
            return ['key' => 'calm', 'name' => 'Pihenő', 'score' => $score];
        }

        return ['key' => 'wilted', 'name' => 'Kókadozó', 'score' => $score];
    }
}
