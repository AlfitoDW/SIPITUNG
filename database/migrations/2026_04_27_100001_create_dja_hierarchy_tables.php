<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── Program ─────────────────────────────────────────────────────────────────
        Schema::create('dja_program', function (Blueprint $table) {
            $table->id();
            $table->string('tahun_anggaran', 4);          // '2026'
            $table->string('kode', 20)->unique();          // '023.01.DK'
            $table->string('nama', 250);
            $table->unsignedBigInteger('pagu')->default(0);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });

        // ─── Sasaran ──────────────────────────────────────────────────────────────────
        Schema::create('dja_sasaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('dja_program')->cascadeOnDelete();
            $table->string('kode', 10);                    // '4472'
            $table->string('nama', 300);
            $table->unsignedBigInteger('pagu')->default(0);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });

        // ─── KRO (Klasifikasi Rincian Output) ─────────────────────────────────────────
        Schema::create('dja_kro', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sasaran_id')->constrained('dja_sasaran')->cascadeOnDelete();
            $table->string('kode', 15);                    // '4472.BDB'
            $table->string('nama', 300);
            $table->unsignedBigInteger('pagu')->default(0);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });

        // ─── RO (Rincian Output) ──────────────────────────────────────────────────────
        Schema::create('dja_ro', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kro_id')->constrained('dja_kro')->cascadeOnDelete();
            $table->string('kode', 20);                    // '4472.BDB.001'
            $table->string('nama', 400);
            $table->unsignedInteger('volume')->default(1);
            $table->string('satuan', 50)->default('Layanan');
            $table->unsignedBigInteger('pagu')->default(0);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });

        // ─── Komponen (Sub-Kegiatan level) ────────────────────────────────────────────
        Schema::create('dja_komponen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ro_id')->constrained('dja_ro')->cascadeOnDelete();
            $table->string('kode', 10);                    // '051','052','997'
            $table->string('nama', 300);
            $table->enum('jenis', ['Utama', 'Pendukung'])->default('Utama');
            $table->unsignedBigInteger('pagu')->default(0);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });

        // ─── Kegiatan (A/B/C level) ───────────────────────────────────────────────────
        Schema::create('dja_kegiatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('komponen_id')->constrained('dja_komponen')->cascadeOnDelete();
            $table->string('kode', 5);                     // 'A','B','C'
            $table->string('nama', 400);
            $table->unsignedBigInteger('pagu')->default(0);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });

        // ─── Rincian Biaya per Kegiatan ───────────────────────────────────────────────
        Schema::create('dja_rincian_biaya', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kegiatan_id')->constrained('dja_kegiatan')->cascadeOnDelete();
            $table->string('kode_akun', 10);               // '521213','522151','524113'
            $table->string('nama_akun', 150);              // 'Belanja Honor Output Kegiatan'
            $table->text('nama_item');                     // uraian detail item
            $table->decimal('volume_default', 10, 2)->default(0);
            $table->string('satuan', 20)->default('OK');   // OH,OJ,OK,OB,KEG
            $table->unsignedBigInteger('harga_satuan')->default(0);
            $table->unsignedBigInteger('pagu_total')->default(0);
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dja_rincian_biaya');
        Schema::dropIfExists('dja_kegiatan');
        Schema::dropIfExists('dja_komponen');
        Schema::dropIfExists('dja_ro');
        Schema::dropIfExists('dja_kro');
        Schema::dropIfExists('dja_sasaran');
        Schema::dropIfExists('dja_program');
    }
};
