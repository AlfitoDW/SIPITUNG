<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Creates the application.
     *
     * Override default Laravel test bootstrap to FORCE load .env.testing
     * so that test DB is always SQLite memory, NEVER MySQL.
     */
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        // Force load .env.testing if exists, before kernel bootstrap
        if (file_exists(__DIR__.'/../.env.testing')) {
            $app->loadEnvironmentFrom('.env.testing');
        }

        $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

        return $app;
    }

    /**
     * Hard safety guard: abort tests if not using SQLite.
     *
     * Mencegah RefreshDatabase atau migrations menghapus data MySQL utama.
     * Test HARUS pakai SQLite memory (lihat phpunit.xml & .env.testing).
     */
    protected function setUp(): void
    {
        parent::setUp();

        $connection = config('database.default');
        if ($connection !== 'sqlite') {
            $this->fail(
                "❌ FATAL: Tests harus pakai SQLite memory, bukan '{$connection}'. ".
                'Pastikan .env.testing ada dengan DB_CONNECTION=sqlite. '.
                'Refusing to run to protect production database.'
            );
        }

        $database = config("database.connections.{$connection}.database");
        if ($database !== ':memory:') {
            $this->fail(
                "❌ FATAL: Test database harus :memory: bukan '{$database}'. ".
                'Refusing to run to protect persistent data.'
            );
        }
    }
}
