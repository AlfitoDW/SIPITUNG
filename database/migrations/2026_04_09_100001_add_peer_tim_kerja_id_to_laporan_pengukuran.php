<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laporan_pengukuran', function (Blueprint $table) {
            // MySQL: drop FK terlebih dahulu, baru bisa drop unique index
            $table->dropForeign(['tim_kerja_id']);
            $table->dropForeign(['periode_pengukuran_id']);

            // Drop unique lama
            $table->dropUnique(['tim_kerja_id', 'periode_pengukuran_id']);

            // Re-create FK (tanpa cascade khusus, ikuti original)
            $table->foreign('tim_kerja_id')->references('id')->on('tim_kerja')->cascadeOnDelete();
            $table->foreign('periode_pengukuran_id')->references('id')->on('periode_pengukuran')->cascadeOnDelete();

            // Tambah kolom peer: tim kolaborator yang menjadi pasangan submission
            // null = laporan solo (IKU tanpa co-PIC lain)
            $table->foreignId('peer_tim_kerja_id')
                ->nullable()
                ->after('periode_pengukuran_id')
                ->constrained('tim_kerja')
                ->nullOnDelete();

            // Unique baru: satu laporan per pasangan (tim, peer) per periode
            $table->unique(
                ['tim_kerja_id', 'periode_pengukuran_id', 'peer_tim_kerja_id'],
                'laporan_unique_pair'
            );
        });
    }

    public function down(): void
    {
        // No-op: rollback tidak aman untuk produksi karena mengubah ulang FK dan unique constraint.
        // Untuk development, gunakan migrate:refresh yang akan recreate table dari awal.
    }
};

