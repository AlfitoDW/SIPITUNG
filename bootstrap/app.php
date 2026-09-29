<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Register role middleware alias
        $middleware->alias([
            'role' => CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (TokenMismatchException $exception, Request $request) {
            if ($request->header('X-Inertia')) {
                return back()->withErrors(['_form' => '[419] Sesi telah kedaluwarsa. Muat ulang halaman lalu coba lagi.']);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $exception, Request $request) {
            if ($request->header('X-Inertia') && in_array($exception->getStatusCode(), [403, 404, 422], true)) {
                return back()->withErrors([
                    '_form' => sprintf('[%d] %s', $exception->getStatusCode(), $exception->getMessage() ?: 'Permintaan tidak dapat diproses.'),
                ]);
            }
        });

        $exceptions->render(function (Throwable $exception, Request $request) {
            if ($request->header('X-Inertia') && $request->is('ketua-tim/pengukuran/store')) {
                return back()->withErrors([
                    '_form' => '[500] Terjadi kesalahan server saat menyimpan Pengukuran. Silakan coba lagi.',
                ]);
            }
        });

    })->create();
