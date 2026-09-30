<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends VerifyEmail
{
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Erősítsd meg a Getingo email címed')
            ->greeting('Szia '.$notifiable->name.'!')
            ->line('Köszönjük, hogy regisztráltál a Getingo oldalán.')
            ->line('A fiókod használatához erősítsd meg az email címed az alábbi gombbal.')
            ->action('Email cím megerősítése', $verificationUrl)
            ->line('A megerősítő link 60 percig érvényes.')
            ->line('Ha nem te hoztad létre ezt a fiókot, nincs további teendőd.')
            ->salutation('Getingo');
    }
}
