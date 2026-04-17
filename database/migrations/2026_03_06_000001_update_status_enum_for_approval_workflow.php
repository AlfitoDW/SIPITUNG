<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('perjanjian_kinerja', function (Blueprint $table) {
            $table->string('status')->default('draft')->change();
        });

        Schema::table('rencana_aksi', function (Blueprint $table) {
            $table->string('status')->default('draft')->change();
        });
    }

    public function down(): void
    {
        // Tidak di-rollback karena perubahan ke string lebih luas dari ENUM asal.
        // Jika perlu fresh install gunakan migrate:fresh.
    }
};
