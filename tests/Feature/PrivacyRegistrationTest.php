<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PrivacyRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_requires_privacy_acknowledgement(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/regisztracio', [
            'name' => 'Teszt Elek',
            'email' => 'privacy@example.com',
            'password' => 'StrongPassword123',
            'password_confirmation' => 'StrongPassword123',
            'privacy_accepted' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('privacy_accepted');

        $this->assertDatabaseMissing('users', [
            'email' => 'privacy@example.com',
        ]);
    }

    public function test_registration_stores_privacy_version_and_timestamp(): void
    {
        Notification::fake();

        config()->set('privacy.version', '2026-09-30-test');

        $response = $this->postJson('/api/regisztracio', [
            'name' => 'Teszt Elek',
            'email' => 'privacy-ok@example.com',
            'password' => 'StrongPassword123',
            'password_confirmation' => 'StrongPassword123',
            'privacy_accepted' => true,
        ]);

        $response->assertCreated();

        $user = \App\Models\User::where('email', 'privacy-ok@example.com')->firstOrFail();

        $this->assertNotNull($user->privacy_accepted_at);
        $this->assertSame('2026-09-30-test', $user->privacy_policy_version);
    }
}
