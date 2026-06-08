<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->string('dja_program_nama')->nullable()->after('tim_kerja_ketua_nip');
            $table->string('dja_sasaran_nama')->nullable()->after('dja_program_nama');
            $table->string('dja_kro_nama')->nullable()->after('dja_sasaran_nama');
            $table->string('dja_kro_kode', 50)->nullable()->after('dja_kro_nama');
            $table->string('dja_ro_nama')->nullable()->after('dja_kro_kode');
            $table->string('dja_komponen_nama')->nullable()->after('dja_ro_nama');
            $table->string('dja_kegiatan_nama')->nullable()->after('dja_komponen_nama');
            $table->string('dja_kegiatan_kode', 50)->nullable()->after('dja_kegiatan_nama');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropColumn('dja_kegiatan_kode');
            $table->dropColumn('dja_kegiatan_nama');
            $table->dropColumn('dja_komponen_nama');
            $table->dropColumn('dja_ro_nama');
            $table->dropColumn('dja_kro_kode');
            $table->dropColumn('dja_kro_nama');
            $table->dropColumn('dja_sasaran_nama');
            $table->dropColumn('dja_program_nama');
        });
    }
};
