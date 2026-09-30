<?php

use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\IsAdmin;
use App\Http\Middleware\NoStorePrivateResponses;
use App\Http\Middleware\RejectOversizedRequests;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified;
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(RejectOversizedRequests::class);
        $middleware->append(SecurityHeaders::class);
        $middleware->statefulApi();

    $middleware->alias([
    'admin' => IsAdmin::class,
    'active' => EnsureUserIsActive::class,
    'no-store' => NoStorePrivateResponses::class,
    'verified' => EnsureEmailIsVerified::class,
]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) =>
                $request->is('api/*') ||
                $request->expectsJson(),
        );
    })
    ->create();