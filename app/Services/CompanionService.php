<?php

namespace App\Services;

use App\Models\LessonProgress;
use App\Models\QuizCompletion;
use App\Models\User;
use App\Models\UserCompanion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CompanionService
{
    private const DECAY_INTERVAL_HOURS = 6;
    private const MIN_STAT = 20;
    private const MAX_LEVEL = 100;

    private const ROOMS = [
        'studio' => ['name' => 'Tech stúdió', 'premium' => false],
        'play' => ['name' => 'Játékszoba', 'premium' => false],
        'night' => ['name' => 'Éjszakai mód', 'premium' => false],
        'aurora' => ['name' => 'Aurora Lounge', 'premium' => true],
        'cyber' => ['name' => 'Cyber Deck', 'premium' => true],
    ];

    private const SKINS = [
        'getingo-mouse' => [
            'name' => 'Getingo Egér',
            'premium' => false,
            'species' => 'mouse',
            'image' => '/mascots/getingo-mouse.png',
            'model_url' => '/models/getingo-buddies/getingo-mouse.glb',
            'description' => 'A mindenki számára elérhető alap Buddy: kíváncsi, barátságos és mindig hoz magával egy kis harapnivalót.',
        ],
        'getingo-sloth' => [
            'name' => 'Getingo Lajhár',
            'premium' => true,
            'species' => 'sloth',
            'image' => '/mascots/getingo-sloth.png',
            'model_url' => '/models/getingo-buddies/getingo-sloth.glb',
            'description' => 'Nyugodt Premium társ, aki emlékeztet rá, hogy a biztos haladás fontosabb a kapkodásnál.',
        ],
        'getingo-reindeer' => [
            'name' => 'Noel Rénszarvas',
            'premium' => true,
            'species' => 'reindeer',
            'image' => '/mascots/getingo-reindeer.png',
            'model_url' => '/models/getingo-buddies/getingo-reindeer.glb',
            'description' => 'Vidám Premium Buddy karakteres agancsokkal és ünnepi energiával.',
        ],
        'getingo-shark' => [
            'name' => 'Getingo Cápa',
            'premium' => true,
            'species' => 'shark',
            'image' => '/mascots/getingo-shark.png',
            'model_url' => '/models/getingo-buddies/getingo-shark.glb',
            'description' => 'Lendületes Premium társ azoknak, akik szeretnek egyenesen ráharapni a következő kihívásra.',
        ],
        'getingo-dragon' => [
            'name' => 'Kis Sárkány',
            'premium' => true,
            'species' => 'dragon',
            'image' => '/mascots/getingo-dragon.png',
            'model_url' => '/models/getingo-buddies/getingo-dragon.glb',
            'description' => 'A Premium kollekció legendás kis sárkánya, látványos szárnyakkal és erős karakterrel.',
        ],
    ];

    private const LEGACY_SKIN_MAP = [
        'code-kitten-3d' => 'getingo-mouse',
        'arctic-byte' => 'getingo-mouse',
        'getingo-puppy' => 'getingo-sloth',
        'royal-circuit' => 'getingo-sloth',
        'neon-orbit' => 'getingo-dragon',
    ];

    private const ACTIONS = [
        'water' => [
            'field' => 'water',
            'cost' => 20,
            'boost' => 30,
            'growth' => 12,
            'label' => 'Itatás',
            'message' => 'Pixel ivott egyet, és újra energikusabb lett.',
        ],
        'feed' => [
            'field' => 'hunger',
            'cost' => 30,
            'boost' => 30,
            'growth' => 15,
            'label' => 'Falatozás',
            'message' => 'Pixel jóllakott, elégedetten folytatja a kalandot és fejlődik tovább.',
        ],
        'play' => [
            'field' => 'happiness',
            'cost' => 25,
            'boost' => 26,
            'growth' => 10,
            'label' => 'Játék',
            'message' => 'A közös játék feldobta Pixel kedvét, és még ügyesebb lett.',
        ],
    ];

    private const ERAS = [
        1 => 'Apró társ',
        2 => 'Kíváncsi felfedező',
        3 => 'Tanuló buddy',
        4 => 'Fejlődő társ',
        5 => 'Okos segítő',
        6 => 'Haladó buddy',
        7 => 'Elit társ',
        8 => 'Mester buddy',
        9 => 'Legendás társ',
        10 => 'Ultimate Getingo Buddy',
    ];

    public function getOrCreate(User $user): UserCompanion
    {
        return UserCompanion::firstOrCreate(
            ['user_id' => $user->id],
            [
                'name' => 'Pixel',
                'care_points' => max(0, (int) $user->xp_points),
                'growth_points' => 0,
                'water' => 74,
                'hunger' => 72,
                'happiness' => 78,
                'selected_skin' => 'getingo-mouse',
                'selected_room' => 'studio',
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

        $normalizedSkin = self::LEGACY_SKIN_MAP[$companion->selected_skin] ?? $companion->selected_skin;
        if (! array_key_exists($normalizedSkin, self::SKINS)) {
            $normalizedSkin = 'getingo-mouse';
        }
        if ($normalizedSkin !== $companion->selected_skin) {
            $companion->selected_skin = $normalizedSkin;
            $companion->save();
        }

        if (! $user->is_premium
            && isset(self::SKINS[$companion->selected_skin])
            && self::SKINS[$companion->selected_skin]['premium']) {
            $companion->selected_skin = 'getingo-mouse';
            $companion->save();
        }

        if (! $user->is_premium
            && isset(self::ROOMS[$companion->selected_room])
            && self::ROOMS[$companion->selected_room]['premium']) {
            $companion->selected_room = 'studio';
            $companion->save();
        }

        $this->applyDecay($companion);
        $companion->refresh();

        $xp = (int) $user->xp_points;
        $learning = $this->learningProgress($user);
        $knowledgeGrowth = $learning['points'];
        $careGrowth = (int) $companion->growth_points;
        // A Buddy tanulási szintjét kizárólag valódi lecke- és kvízteljesítés növeli.
        // A gondozás továbbra is ad kötődési/growth pontot, de nem lehet vele kiváltani a tanulást.
        $growth = $this->growthForPoints($knowledgeGrowth, $knowledgeGrowth, $careGrowth, $learning);
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
                'selected_room' => $companion->selected_room ?? 'studio',
                'last_interaction_at' => $companion->last_interaction_at,
            ],
            'growth' => $growth,
            'mood' => $mood,
            'xp_points' => $xp,
            'available_skins' => collect(self::SKINS)
                ->map(fn (array $skin, string $key) => [
                    'key' => $key,
                    'name' => $skin['name'],
                    'premium' => $skin['premium'],
                    'species' => $skin['species'],
                    'image' => $skin['image'],
                    'model_url' => $skin['model_url'],
                    'description' => $skin['description'],
                    'unlocked' => ! $skin['premium'] || $user->is_premium,
                ])
                ->values(),
            'available_rooms' => collect(self::ROOMS)
                ->map(fn (array $room, string $key) => [
                    'key' => $key,
                    'name' => $room['name'],
                    'premium' => $room['premium'],
                    'unlocked' => ! $room['premium'] || $user->is_premium,
                ])
                ->values(),
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


    public function updatePreferences(User $user, ?string $room, ?string $skin): array
    {
        $companion = $this->getOrCreate($user);

        if ($room !== null) {
            if (! array_key_exists($room, self::ROOMS)) {
                throw ValidationException::withMessages(['room' => 'Ismeretlen Buddy szoba.']);
            }
            if (self::ROOMS[$room]['premium'] && ! $user->is_premium) {
                throw ValidationException::withMessages(['room' => 'Ez a szoba Premium előfizetéshez tartozik.']);
            }
            $companion->selected_room = $room;
        }

        if ($skin !== null) {
            if (! array_key_exists($skin, self::SKINS)) {
                throw ValidationException::withMessages(['skin' => 'Ismeretlen Buddy skin.']);
            }
            if (self::SKINS[$skin]['premium'] && ! $user->is_premium) {
                throw ValidationException::withMessages(['skin' => 'Ez a skin Premium előfizetéshez tartozik.']);
            }
            $companion->selected_skin = $skin;
        }

        $companion->save();

        return $this->state($user->fresh(), $companion->fresh());
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

    private function growthForPoints(
        int $points,
        int $knowledgeGrowth,
        int $careGrowth,
        array $learning
    ): array {
        $maxLevel = max(2, (int) config('gamification.companion.max_level', self::MAX_LEVEL));
        $level = 1;

        for ($candidate = 2; $candidate <= $maxLevel; $candidate++) {
            if ($points < $this->pointsRequiredForLevel($candidate, $maxLevel)) {
                break;
            }

            $level = $candidate;
        }

        $era = min(10, intdiv($level - 1, max(1, intdiv($maxLevel, 10))) + 1);
        $currentLevelPoints = $this->pointsRequiredForLevel($level, $maxLevel);
        $nextLevelPoints = $level >= $maxLevel
            ? null
            : $this->pointsRequiredForLevel($level + 1, $maxLevel);

        if ($nextLevelPoints === null) {
            $progress = 100;
            $pointsToNext = 0;
        } else {
            $range = max(1, $nextLevelPoints - $currentLevelPoints);
            $progress = (int) floor((($points - $currentLevelPoints) / $range) * 100);
            $progress = max(0, min(100, $progress));
            $pointsToNext = max(0, $nextLevelPoints - $points);
        }

        $sizePercentage = (int) round(70 + (($level - 1) / max(1, $maxLevel - 1)) * 55);

        return [
            'key' => 'era-'.$era,
            'level' => $level,
            'max_level' => $maxLevel,
            'era' => $era,
            'name' => self::ERAS[$era],
            'progress_percentage' => $progress,
            'current_level_points' => $currentLevelPoints,
            'next_level_points' => $nextLevelPoints,
            'points_to_next_level' => $pointsToNext,
            // Backwards-compatible fields for the current Angular client.
            'next_stage_points' => $nextLevelPoints,
            'points_to_next_stage' => $pointsToNext,
            'knowledge_growth_points' => $knowledgeGrowth,
            'care_growth_points' => $careGrowth,
            'total_growth_points' => $points,
            'size_percentage' => $sizePercentage,
            'curriculum_points' => $learning['points'],
            'curriculum_max_points' => $learning['max_points'],
            'completed_lessons' => $learning['completed_lessons'],
            'total_lessons' => $learning['total_lessons'],
            'completed_quizzes' => $learning['completed_quizzes'],
            'total_quizzes' => $learning['total_quizzes'],
            'curriculum_percentage' => $learning['percentage'],
        ];
    }

    private function pointsRequiredForLevel(int $level, int $maxLevel = self::MAX_LEVEL): int
    {
        if ($level <= 1) {
            return 0;
        }

        $maxPoints = max(1, (int) config('gamification.curriculum.max_xp', 11275));
        if ($level >= $maxLevel) {
            return $maxPoints;
        }

        $exponent = max(1.0, (float) config('gamification.companion.level_curve_exponent', 1.35));
        $ratio = ($level - 1) / max(1, $maxLevel - 1);

        return min($maxPoints, max(1, (int) round($maxPoints * pow($ratio, $exponent))));
    }

    private function learningProgress(User $user): array
    {
        $totalLessons = max(1, (int) config('gamification.curriculum.lessons', 451));
        $totalQuizzes = max(1, (int) config('gamification.curriculum.quizzes', 1353));
        $lessonXp = max(0, (int) config('gamification.curriculum.lesson_xp', 10));
        $quizXp = max(0, (int) config('gamification.curriculum.quiz_xp', 5));
        $maxPoints = max(1, ($totalLessons * $lessonXp) + ($totalQuizzes * $quizXp));

        $completedLessons = min(
            $totalLessons,
            LessonProgress::query()
                ->where('user_id', $user->id)
                ->where('completed', true)
                ->count()
        );
        $completedQuizzes = min(
            $totalQuizzes,
            QuizCompletion::query()
                ->where('user_id', $user->id)
                ->count()
        );

        $points = min($maxPoints, ($completedLessons * $lessonXp) + ($completedQuizzes * $quizXp));

        return [
            'points' => $points,
            'max_points' => $maxPoints,
            'completed_lessons' => $completedLessons,
            'total_lessons' => $totalLessons,
            'completed_quizzes' => $completedQuizzes,
            'total_quizzes' => $totalQuizzes,
            'percentage' => (int) floor(($points / $maxPoints) * 100),
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
            return ['key' => 'happy', 'name' => 'Vidám', 'score' => $score];
        }

        if ($score >= 45) {
            return ['key' => 'calm', 'name' => 'Nyugodt', 'score' => $score];
        }

        return ['key' => 'wilted', 'name' => 'Álmos', 'score' => $score];
    }
}
