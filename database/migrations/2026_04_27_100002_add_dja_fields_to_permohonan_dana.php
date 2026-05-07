<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── Tambah kolom DJA ke permohonan_dana ──────────────────────────────────
        Schema::table('permohonan_dana', function (Blueprint $table) {
            // Hierarki anggaran DJA
            $table->foreignId('dja_program_id')->nullable()->constrained('dja_program')->nullOnDelete()->after('tim_kerja_id');
            $table->foreignId('dja_sasaran_id')->nullable()->constrained('dja_sasaran')->nullOnDelete()->after('dja_program_id');
            $table->foreignId('dja_kro_id')->nullable()->constrained('dja_kro')->nullOnDelete()->after('dja_sasaran_id');
            $table->foreignId('dja_ro_id')->nullable()->constrained('dja_ro')->nullOnDelete()->after('dja_kro_id');
            $table->foreignId('dja_komponen_id')->nullable()->constrained('dja_komponen')->nullOnDelete()->after('dja_ro_id');
            $table->foreignId('dja_kegiatan_id')->nullable()->constrained('dja_kegiatan')->nullOnDelete()->after('dja_komponen_id');

            // Judul pekerjaan spesifik (beda dari keperluan umum)
            $table->string('judul_pekerjaan')->nullable()->after('dja_kegiatan_id');

            // Waktu & Penanggung Jawab (diisi di step 2 wizard)
            $table->time('jam_pelaksanaan')->nullable()->after('tanggal_selesai');
            $table->foreignId('kapokja_id')->nullable()->constrained('users')->nullOnDelete()->after('jam_pelaksanaan');
            $table->date('tgl_pertanggungjawaban')->nullable()->after('kapokja_id');
            $table->foreignId('pic_keuangan_id')->nullable()->constrained('users')->nullOnDelete()->after('tgl_pertanggungjawaban');

            // Tracking wizard step (1–4)
            $table->tinyInteger('wizard_step')->default(1)->after('status');
        });

        // ─── Tambah dja_rincian_biaya_id ke permohonan_dana_item ─────────────────
        Schema::table('permohonan_dana_item', function (Blueprint $table) {
            $table->foreignId('dja_rincian_biaya_id')
                  ->nullable()
                  ->constrained('dja_rincian_biaya')
                  ->nullOnDelete()
                  ->after('permohonan_dana_id');
            $table->unsignedBigInteger('jumlah_permintaan')->default(0)->after('total');
        });

        // ─── Tabel Dokumen Pendukung ──────────────────────────────────────────────
        Schema::create('permohonan_dana_dokumen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permohonan_dana_id')
                  ->constrained('permohonan_dana')
                  ->cascadeOnDelete();
            $table->tinyInteger('jenis_dokumen_id');       // 1-8
            $table->string('nama_jenis', 150);
            $table->string('nama_file', 255);
            $table->string('path_file', 500);
            $table->unsignedInteger('ukuran_file')->default(0); // bytes
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permohonan_dana_dokumen');

        Schema::table('permohonan_dana_item', function (Blueprint $table) {
            $table->dropForeign(['dja_rincian_biaya_id']);
            $table->dropColumn(['dja_rincian_biaya_id', 'jumlah_permintaan']);
        });

        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropForeign(['dja_program_id']);
            $table->dropForeign(['dja_sasaran_id']);
            $table->dropForeign(['dja_kro_id']);
            $table->dropForeign(['dja_ro_id']);
            $table->dropForeign(['dja_komponen_id']);
            $table->dropForeign(['dja_kegiatan_id']);
            $table->dropForeign(['kapokja_id']);
            $table->dropForeign(['pic_keuangan_id']);
            $table->dropColumn([
                'dja_program_id', 'dja_sasaran_id', 'dja_kro_id',
                'dja_ro_id', 'dja_komponen_id', 'dja_kegiatan_id',
                'judul_pekerjaan', 'jam_pelaksanaan',
                'kapokja_id', 'tgl_pertanggungjawaban', 'pic_keuangan_id',
                'wizard_step',
            ]);
        });
    }
};
