<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserCompanion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CompanionService
{
    private const ACTIONS = [
        'water' => [
            'field' => 'water',
            'cost' => 20,
            'boost' => 30,
            'label' => 'Öntözés',
            'message' => 'Kódmag kapott egy kis vizet.',
        ],
        'feed' => [
            'field' => 'hunger',
            'cost' => 30,
            'boost' => 30,
            'label' => 'Etetés',
            'message' => 'Kódmag jóllakott.',
        ],
        'play' => [
            'field' => 'happiness',
            'cost' => 25,
            'boost' => 25,
            'label' => 'Játék',
            'message' => 'Kódmag feldobódott a közös játéktól.',
        ],
    ];

    public function getOrCreate(User $user): UserCompanion
    {
        return UserCompanion::firstOrCreate(
            ['user_id' => $user->id],
            [
                'name' => 'Kódmag',
                'care_points' => max(0, (int) $user->xp_points),
                'water' => 70,
                'hunger' => 70,
                'happiness' => 70,
                'selected_skin' => 'azure-sprout',
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

            $field = $config['field'];
            $currentValue = (int) $companion->{$field};
            $cost = (int) $config['cost'];

            if ($currentValue >= 100) {
                throw ValidationException::withMessages([
                    'action' => 'Ez az érték már maximumon van.',
                ]);
            }

            if ($companion->care_points < $cost) {
                throw ValidationException::withMessages([
                    'action' => 'Nincs elég gondozási pontod ehhez.',
                ]);
            }

            $companion->care_points -= $cost;
            $companion->{$field} = min(100, $currentValue + (int) $config['boost']);
            $companion->last_interaction_at = now();
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
        $xp = (int) $user->xp_points;
        $stage = $this->stageForXp($xp);

        return [
            'companion' => [
                'id' => $companion->id,
                'name' => $companion->name,
                'care_points' => $companion->care_points,
                'water' => $companion->water,
                'hunger' => $companion->hunger,
                'happiness' => $companion->happiness,
                'selected_skin' => $companion->selected_skin,
                'last_interaction_at' => $companion->last_interaction_at,
            ],
            'growth' => $stage,
            'xp_points' => $xp,
            'actions' => collect(self::ACTIONS)
                ->map(fn (array $config, string $key) => [
                    'key' => $key,
                    'label' => $config['label'],
                    'cost' => $config['cost'],
                    'boost' => $config['boost'],
                ])
                ->values(),
        ];
    }

    private function stageForXp(int $xp): array
    {
        $stages = [
            ['key' => 'seed', 'level' => 1, 'name' => 'Magocska', 'min' => 0, 'next' => 100],
            ['key' => 'sprout', 'level' => 2, 'name' => 'Kis hajtás', 'min' => 100, 'next' => 300],
            ['key' => 'plant', 'level' => 3, 'name' => 'Fejlődő növény', 'min' => 300, 'next' => 700],
            ['key' => 'tree', 'level' => 4, 'name' => 'Kódfa', 'min' => 700, 'next' => 1500],
            ['key' => 'legendary', 'level' => 5, 'name' => 'Legendás Kódfa', 'min' => 1500, 'next' => null],
        ];

        $current = $stages[0];

        foreach ($stages as $stage) {
            if ($xp >= $stage['min']) {
                $current = $stage;
            }
        }

        if ($current['next'] === null) {
            $progress = 100;
            $xpToNext = 0;
        } else {
            $range = $current['next'] - $current['min'];
            $progress = (int) floor((($xp - $current['min']) / $range) * 100);
            $progress = max(0, min(100, $progress));
            $xpToNext = max(0, $current['next'] - $xp);
        }

        return [
            'key' => $current['key'],
            'level' => $current['level'],
            'name' => $current['name'],
            'progress_percentage' => $progress,
            'next_stage_xp' => $current['next'],
            'xp_to_next_stage' => $xpToNext,
        ];
    }
}
