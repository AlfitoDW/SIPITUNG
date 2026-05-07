<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'super_admin',
            'ketua_tim_kerja',
            'pimpinan',
            'bendahara',
            'pumk',
            'pic_keuangan'
        ) NOT NULL DEFAULT 'ketua_tim_kerja'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM(
            'super_admin',
            'ketua_tim_kerja',
            'pimpinan',
            'bendahara'
        ) NOT NULL DEFAULT 'ketua_tim_kerja'");
    }
};
