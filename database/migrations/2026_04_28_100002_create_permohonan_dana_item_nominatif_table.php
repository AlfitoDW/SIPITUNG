<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permohonan_dana_item_nominatif', function (Blueprint $table) {
            $table->id();

            $table->foreignId('permohonan_dana_item_id')
                  ->constrained('permohonan_dana_item')
                  ->cascadeOnDelete();

            $table->foreignId('permohonan_dana_id')
                  ->constrained('permohonan_dana')
                  ->cascadeOnDelete();

            $table->foreignId('ref_nama_id')
                  ->nullable()
                  ->constrained('ref_nama')
                  ->nullOnDelete();

            // Snapshot data pegawai (tidak berubah meski ref_nama diubah)
            $table->string('nama', 150);
            $table->string('nip', 30)->nullable();
            $table->string('nik', 20)->nullable();
            $table->string('npwp', 25)->nullable();
            $table->string('gol_ruang', 10)->nullable();
            $table->string('nama_rekening', 150)->nullable();
            $table->string('no_rekening', 30)->nullable();
            $table->string('nama_bank', 100)->nullable();
            $table->string('email', 150)->nullable();
            $table->decimal('pph21_persen', 5, 2)->default(0);

            // ─── Honor (521115, 521213, 522151) ───────────────────────────────
            $table->string('jabatan', 100)->nullable();
            $table->decimal('volume', 10, 2)->default(1);
            $table->decimal('harga_satuan', 15, 2)->default(0);
            $table->decimal('jumlah_bruto', 15, 2)->default(0);  // volume × harga_satuan
            $table->decimal('jumlah_pajak', 15, 2)->default(0);  // jumlah_bruto × (pph21/100)
            $table->decimal('jumlah_diterima', 15, 2)->default(0); // jumlah_bruto - jumlah_pajak

            // ─── Perjalanan Dinas (524111, 524119, 524113) ────────────────────
            $table->decimal('transport', 15, 2)->default(0);
            $table->decimal('uang_harian_vol', 10, 2)->default(0);
            $table->decimal('uang_harian_satuan', 15, 2)->default(0);
            $table->decimal('uang_harian_jumlah', 15, 2)->default(0);
            $table->decimal('fullboard_vol', 10, 2)->default(0);
            $table->decimal('fullboard_satuan', 15, 2)->default(0);
            $table->decimal('fullboard_jumlah', 15, 2)->default(0);
            $table->decimal('fullday_vol', 10, 2)->default(0);
            $table->decimal('fullday_satuan', 15, 2)->default(0);
            $table->decimal('fullday_jumlah', 15, 2)->default(0);
            $table->decimal('representasi', 15, 2)->default(0);
            $table->decimal('taksi_pp', 15, 2)->default(0);
            $table->decimal('tiket_pesawat', 15, 2)->default(0);
            $table->decimal('hotel', 15, 2)->default(0);
            $table->decimal('jumlah_perjadin', 15, 2)->default(0);

            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permohonan_dana_item_nominatif');
    }
};
