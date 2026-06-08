<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->string('tim_kerja_nama')->nullable()->after('pic_keuangan_nip');
            $table->string('tim_kerja_kode', 20)->nullable()->after('tim_kerja_nama');
            $table->string('tim_kerja_ketua_name')->nullable()->after('tim_kerja_kode');
            $table->string('tim_kerja_ketua_nip', 30)->nullable()->after('tim_kerja_ketua_name');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropColumn('tim_kerja_ketua_nip');
            $table->dropColumn('tim_kerja_ketua_name');
            $table->dropColumn('tim_kerja_kode');
            $table->dropColumn('tim_kerja_nama');
        });
    }
};
