<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ubah FK constraint di permohonan_dana dari cascadeOnDelete ke restrictOnDelete
     * untuk tim_kerja_id dan tahun_anggaran_id.
     *
     * Ini mencegah penghapusan master data (tim kerja / tahun anggaran) yang masih
     * memiliki histori permohonan dana, sehingga audit trail keuangan tetap utuh.
     */
    public function up(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropForeign(['tim_kerja_id']);
            $table->foreign('tim_kerja_id')
                ->references('id')
                ->on('tim_kerja')
                ->restrictOnDelete();

            $table->dropForeign(['tahun_anggaran_id']);
            $table->foreign('tahun_anggaran_id')
                ->references('id')
                ->on('tahun_anggaran')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropForeign(['tim_kerja_id']);
            $table->foreign('tim_kerja_id')
                ->references('id')
                ->on('tim_kerja')
                ->cascadeOnDelete();

            $table->dropForeign(['tahun_anggaran_id']);
            $table->foreign('tahun_anggaran_id')
                ->references('id')
                ->on('tahun_anggaran')
                ->cascadeOnDelete();
        });
    }
};
