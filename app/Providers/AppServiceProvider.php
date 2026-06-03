<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') === 'production') {
            \URL::forceScheme('https');
        }

        $this->configureDefaults();
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        // ────────────────────────────────────────────────────────────────────
        // ABSOLUTE GUARD: Block destructive DB commands DI SEMUA environment
        // KECUALI testing (yang pakai SQLite memory).
        //
        // Yang di-block:
        //   - migrate:fresh   (drop semua tables)
        //   - migrate:reset   (rollback semua migrations)
        //   - db:wipe         (drop semua tables, types, views)
        //
        // Yang TIDAK di-block (masih bisa dipakai):
        //   - migrate                 (apply pending migrations)
        //   - migrate:rollback        (rollback step by step, bisa dibatasi)
        //   - migrate:status
        //   - db:seed                 (insert/update data, tidak destructive)
        //
        // Kalau perlu reset DB local untuk dev, gunakan tools eksternal
        // (mysql CLI, phpMyAdmin, dll) — JANGAN dari artisan.
        // ────────────────────────────────────────────────────────────────────
        $isTesting = app()->environment('testing')
            || config('database.default') === 'sqlite'
            || config('database.connections.'.config('database.default').'.database') === ':memory:';

        DB::prohibitDestructiveCommands(! $isTesting);

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
