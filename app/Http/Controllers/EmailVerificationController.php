<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EmailVerificationController extends Controller
{
    public function verify(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);

        abort_unless(
            hash_equals($hash, sha1($user->getEmailForVerification())),
            Response::HTTP_FORBIDDEN
        );

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        $frontendUrl = rtrim(
            (string) config('app.frontend_url', config('app.url')),
            '/'
        );

        return redirect()->away($frontendUrl.'/email-verified');
    }

    public function resend(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Az email címed már meg van erősítve.',
                'verified' => true,
            ]);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Új megerősítő emailt küldtünk.',
            'verified' => false,
        ]);
    }
}
