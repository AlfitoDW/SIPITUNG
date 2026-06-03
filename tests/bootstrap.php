<?php

/*
|--------------------------------------------------------------------------
| Custom Test Bootstrap
|--------------------------------------------------------------------------
|
| Loaded by phpunit.xml BEFORE Laravel boots.
| FORCES SQLite memory for ALL tests so MySQL production data is never touched.
|
| This is a defense-in-depth measure on top of:
|   - phpunit.xml <env> tags
|   - .env.testing file
|   - tests/TestCase.php setUp guard
*/

// Force SQLite memory for test database BEFORE anything else.
// putenv() + $_ENV + $_SERVER ensures all 3 layers Laravel checks are set.
$forceTestEnv = [
    'APP_ENV'       => 'testing',
    'DB_CONNECTION' => 'sqlite',
    'DB_DATABASE'   => ':memory:',
    'CACHE_STORE'   => 'array',
    'SESSION_DRIVER' => 'array',
    'QUEUE_CONNECTION' => 'sync',
    'MAIL_MAILER'   => 'array',
    'BROADCAST_CONNECTION' => 'null',
    'TELESCOPE_ENABLED' => 'false',
    'PULSE_ENABLED' => 'false',
    'NIGHTWATCH_ENABLED' => 'false',
];

foreach ($forceTestEnv as $key => $value) {
    putenv("$key=$value");
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}

// Then load Composer autoloader as normal
require __DIR__.'/../vendor/autoload.php';
