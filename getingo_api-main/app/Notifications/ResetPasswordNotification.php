<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
        $email = $notifiable->getEmailForPasswordReset();
        $resetUrl = $frontendUrl.'/reset-password?token='.urlencode($this->token).'&email='.urlencode($email);

        return (new MailMessage)
            ->subject('Getingo jelszó visszaállítása')
            ->greeting('Szia '.$notifiable->name.'!')
            ->line('Jelszó-visszaállítási kérelmet kaptunk a Getingo fiókodhoz.')
            ->action('Új jelszó beállítása', $resetUrl)
            ->line('A jelszó-visszaállító link 60 percig érvényes.')
            ->line('Ha nem te kérted a jelszó visszaállítását, nincs további teendőd.')
            ->salutation('Getingo');
    }
}
