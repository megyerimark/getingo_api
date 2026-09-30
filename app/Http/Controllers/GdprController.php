<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Stripe\StripeClient;
use Throwable;

class GdprController extends Controller
{
    public function exportData(Request $request)
    {
        $user = $request->user();

        $payload = [
            'exported_at' => now()->toIso8601String(),
            'account' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'xp_points' => $user->xp_points,
                'current_streak' => $user->current_streak,
                'longest_streak' => $user->longest_streak,
                'last_learning_activity_on' => $user->last_learning_activity_on,
                'privacy_accepted_at' => $user->privacy_accepted_at,
                'privacy_policy_version' => $user->privacy_policy_version,
                'plan' => $user->plan,
                'subscription_status' => $user->subscription_status,
                'subscription_billing_cycle' => $user->subscription_billing_cycle,
                'subscription_current_period_end' => $user->subscription_current_period_end,
                'stripe_customer_id' => $user->stripe_customer_id,
                'stripe_subscription_id' => $user->stripe_subscription_id,
                'premium_started_at' => $user->premium_started_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
            'notes' => $user->notes()
                ->select('id', 'user_id', 'lesson_id', 'content', 'created_at', 'updated_at')
                ->get(),
            'favorites' => $user->favorites()
                ->select('id', 'user_id', 'lesson_id', 'created_at', 'updated_at')
                ->get(),
            'lesson_progress' => $user->lessonProgress()
                ->select('id', 'user_id', 'lesson_id', 'completed', 'created_at', 'updated_at')
                ->get(),
            'quiz_completions' => $user->quizCompletions()
                ->select('id', 'user_id', 'quiz_id', 'created_at', 'updated_at')
                ->get(),
            'achievements' => $user->userAchievements()
                ->with('achievement:id,slug,title,description,icon')
                ->select('id', 'user_id', 'achievement_id', 'unlocked_at', 'created_at', 'updated_at')
                ->get(),
            'project_submissions' => $user->projectSubmissions()
                ->select(
                    'id',
                    'user_id',
                    'project_id',
                    'html_code',
                    'css_code',
                    'javascript_code',
                    'last_console_output',
                    'completed_at',
                    'xp_awarded',
                    'created_at',
                    'updated_at'
                )
                ->get(),
            'subscription_payments' => $user->subscriptionPayments()
                ->select('id', 'user_id', 'stripe_invoice_id', 'stripe_customer_id', 'stripe_subscription_id', 'status', 'amount_paid', 'amount_due', 'currency', 'billing_reason', 'paid_at', 'period_start', 'period_end', 'created_at', 'updated_at')
                ->get(),
            'companion' => $user->companion()
                ->select(
                    'id',
                    'user_id',
                    'name',
                    'care_points',
                    'growth_points',
                    'water',
                    'hunger',
                    'happiness',
                    'selected_skin',
                    'selected_room',
                    'last_interaction_at',
                    'last_decay_at',
                    'created_at',
                    'updated_at'
                )
                ->first(),
        ];

        return response()->json($payload)
            ->header('Content-Disposition', 'attachment; filename="getingo-data-'.$user->id.'.json"')
            ->header('Cache-Control', 'no-store, private');
    }

    public function deleteAccount(Request $request)
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'max:1024'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'A megadott jelszó hibás.',
            ], 422);
        }

        if ($user->role === 'admin' && User::where('role', 'admin')->count() <= 1) {
            return response()->json([
                'message' => 'Az utolsó adminisztrátori fiók nem törölhető. Előbb hozz létre egy másik admint.',
            ], 409);
        }

        if ($user->stripe_subscription_id && ! in_array($user->subscription_status, ['canceled', 'incomplete_expired'], true)) {
            $secret = config('services.stripe.secret');

            if (! $secret) {
                return response()->json([
                    'message' => 'Az aktív Stripe előfizetés miatt a fiók törlése most nem hajtható végre. A Stripe konfiguráció hiányzik.',
                ], 503);
            }

            try {
                (new StripeClient($secret))->subscriptions->cancel(
                    $user->stripe_subscription_id,
                    []
                );
            } catch (Throwable) {
                return response()->json([
                    'message' => 'Az előfizetés lemondása nem sikerült, ezért a fiókot biztonsági okból nem töröltük. Próbáld újra később.',
                ], 502);
            }
        }

        DB::transaction(function () use ($user): void {
            $user->tokens()->delete();
            $user->subscriptionPayments()->delete();

            if (Schema::hasTable('sessions')) {
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }

            if (Schema::hasTable('password_reset_tokens')) {
                DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            }

            $user->delete();
        });

        return response()->json([
            'message' => 'A fiók, a hozzá kapcsolódó személyes adatok és az esetleges Premium előfizetés törlése/lemondása megtörtént.',
        ]);
    }
}
