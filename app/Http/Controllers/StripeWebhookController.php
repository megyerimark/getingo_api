<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;
use UnexpectedValueException;

class StripeWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $secret = config('services.stripe.webhook_secret');

        if (! $secret) {
            return response()->json(['message' => 'Webhook secret nincs beállítva.'], 503);
        }

        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                (string) $request->header('Stripe-Signature'),
                $secret
            );
        } catch (UnexpectedValueException|SignatureVerificationException $exception) {
            Log::warning('Stripe webhook ellenőrzés sikertelen.', [
                'message' => $exception->getMessage(),
            ]);

            return response()->json(['message' => 'Érvénytelen Stripe webhook.'], 400);
        }

        switch ($event->type) {
            case 'checkout.session.completed':
                $session = $event->data->object;

                if (($session->mode ?? null) === 'subscription' && ! empty($session->subscription)) {
                    $user = ! empty($session->customer)
                        ? User::where('stripe_customer_id', (string) $session->customer)->first()
                        : null;

                    if (! $user && ! empty($session->client_reference_id)) {
                        $user = User::find($session->client_reference_id);
                    }

                    if ($user) {
                        $user->stripe_customer_id = $session->customer ?? $user->stripe_customer_id;
                        $user->stripe_subscription_id = (string) $session->subscription;
                        $user->save();
                    }
                }
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                $this->syncSubscription($event->data->object);
                break;
        }

        return response()->json(['received' => true]);
    }

    private function syncSubscription($subscription): void
    {
        $user = User::query()
            ->where('stripe_customer_id', (string) $subscription->customer)
            ->orWhere('stripe_subscription_id', $subscription->id)
            ->first();

        if (! $user) {
            return;
        }

        $status = (string) $subscription->status;
        $premium = in_array($status, ['active', 'trialing'], true)
            && $this->containsPremiumPrice($subscription);

        $periodEnd = $subscription->items->data[0]->current_period_end ?? null;

        $user->forceFill([
            'stripe_customer_id' => (string) $subscription->customer,
            'stripe_subscription_id' => $subscription->id,
            'subscription_status' => $status,
            'subscription_current_period_end' => $periodEnd
                ? Carbon::createFromTimestampUTC((int) $periodEnd)
                : null,
            'plan' => $premium ? 'premium' : 'free',
        ])->save();
    }

    private function containsPremiumPrice($subscription): bool
    {
        $allowed = array_filter([
            config('services.stripe.premium_monthly_price_id'),
            config('services.stripe.premium_yearly_price_id'),
        ]);

        foreach ($subscription->items->data as $item) {
            if (in_array($item->price->id ?? null, $allowed, true)) {
                return true;
            }
        }

        return false;
    }
}
