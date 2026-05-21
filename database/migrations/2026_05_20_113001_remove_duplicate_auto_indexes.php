<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Hapus index duplikat yang tergenerate otomatis dari migration sebelumnya
        // yang gagal karena nama terlalu panjang (MySQL limit 64 chars).
        // Index custom dengan nama pendek sudah dibuat di migration 2026_05_20_113000.
        // Note: hanya dijalankan jika index benar-benar ada (MySQL), skip di SQLite test.
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        $indexes = [
            'permohonan_dana_tahun_anggaran_id_status_index',
            'permohonan_dana_tahun_anggaran_id_created_by_index',
            'permohonan_dana_tahun_anggaran_id_tim_kerja_id_index',
            'permohonan_dana_status_kapokja_id_index',
            'permohonan_dana_status_pic_keuangan_id_index',
        ];

        foreach ($indexes as $index) {
            $exists = DB::select(
                "SELECT 1 FROM information_schema.statistics
                 WHERE table_schema = DATABASE()
                   AND table_name = 'permohonan_dana'
                   AND index_name = ?",
                [$index]
            );

            if (! empty($exists)) {
                DB::statement("DROP INDEX `{$index}` ON `permohonan_dana`");
            }
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->index(['tahun_anggaran_id', 'status']);
            $table->index(['tahun_anggaran_id', 'created_by']);
            $table->index(['tahun_anggaran_id', 'tim_kerja_id']);
            $table->index(['status', 'kapokja_id']);
            $table->index(['status', 'pic_keuangan_id']);
        });
    }
};
