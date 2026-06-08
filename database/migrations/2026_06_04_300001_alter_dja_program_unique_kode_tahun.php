<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ubah unique constraint dja_program dari global (kode saja)
     * menjadi composite (kode + tahun_anggaran) agar bisa impor
     * DJA untuk tahun anggaran yang berbeda dengan kode program sama.
     */
    public function up(): void
    {
        Schema::table('dja_program', function (Blueprint $table) {
            $table->dropUnique(['kode']);
            $table->unique(['kode', 'tahun_anggaran']);
        });
    }

    public function down(): void
    {
        Schema::table('dja_program', function (Blueprint $table) {
            $table->dropUnique(['kode', 'tahun_anggaran']);
            $table->unique('kode');
        });
    }
};
