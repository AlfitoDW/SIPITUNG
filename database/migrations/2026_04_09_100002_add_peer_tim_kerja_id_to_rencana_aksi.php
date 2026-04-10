<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rencana_aksi', function (Blueprint $table) {
            // Drop FK → drop unique → add peer → new unique
            $table->dropForeign(['tahun_anggaran_id']);
            $table->dropForeign(['tim_kerja_id']);
            $table->dropUnique(['tahun_anggaran_id', 'tim_kerja_id']);

            $table->foreign('tahun_anggaran_id')->references('id')->on('tahun_anggaran')->cascadeOnDelete();
            $table->foreign('tim_kerja_id')->references('id')->on('tim_kerja')->cascadeOnDelete();

            $table->foreignId('peer_tim_kerja_id')
                ->nullable()
                ->after('tim_kerja_id')
                ->constrained('tim_kerja')
                ->nullOnDelete();

            $table->unique(
                ['tahun_anggaran_id', 'tim_kerja_id', 'peer_tim_kerja_id'],
                'ra_unique_pair'
            );
        });
    }

    public function down(): void
    {
        // No-op: rollback tidak aman untuk produksi karena mengubah ulang FK dan unique constraint.
        // Untuk development, gunakan migrate:refresh yang akan recreate table dari awal.
    }
};
