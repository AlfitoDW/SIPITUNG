<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop unique on kode alone
        Schema::table('tim_kerja', function (Blueprint $table) {
            $table->dropUnique('tim_kerja_kode_unique');
        });

        // Add composite unique on (kode, tahun_anggaran_id)
        Schema::table('tim_kerja', function (Blueprint $table) {
            $table->unique(['kode', 'tahun_anggaran_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tim_kerja', function (Blueprint $table) {
            $table->dropUnique(['kode', 'tahun_anggaran_id']);
        });

        Schema::table('tim_kerja', function (Blueprint $table) {
            $table->unique('kode');
        });
    }
};
