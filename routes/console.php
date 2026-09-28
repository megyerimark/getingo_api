<?php

use App\Models\AdminAuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

Artisan::command('getingo:create-admin {email?} {--name=Administrator}', function () {
    $email = $this->argument('email') ?: $this->ask('Admin email címe');
    $name = (string) $this->option('name');
    $password = $this->secret('Adj meg egy erős admin jelszót');
    $confirmation = $this->secret('Jelszó újra');

    $validator = Validator::make([
        'name' => $name,
        'email' => $email,
        'password' => $password,
        'password_confirmation' => $confirmation,
    ], [
        'name' => ['required', 'string', 'max:100'],
        'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
        'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()],
    ]);

    if ($validator->fails()) {
        foreach ($validator->errors()->all() as $error) {
            $this->error($error);
        }

        return 1;
    }

    $user = User::create([
        'name' => strip_tags($name),
        'email' => strtolower(trim($email)),
        'password' => $password,
    ]);

    $user->role = 'admin';
    $user->save();

    $this->info("Admin létrehozva: {$user->email}");

    return 0;
})->purpose('Biztonságosan létrehoz egy adminisztrátori felhasználót.');

Schedule::command('sanctum:prune-expired --hours=24')->daily();

Schedule::call(function (): void {
    AdminAuditLog::where(
        'created_at',
        '<',
        now()->subDays((int) config('security.audit_log_retention_days', 90))
    )->delete();
})->daily();
