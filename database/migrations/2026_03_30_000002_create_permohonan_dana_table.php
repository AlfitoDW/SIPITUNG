<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permohonan_dana', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_anggaran_id')->constrained('tahun_anggaran')->cascadeOnDelete();
            $table->foreignId('tim_kerja_id')->constrained('tim_kerja')->cascadeOnDelete();
            $table->string('nomor_permohonan')->unique();
            $table->string('keperluan');
            $table->date('tanggal_kegiatan');
            $table->text('keterangan')->nullable();
            $table->decimal('total_anggaran', 15, 2)->default(0);
            $table->enum('status', [
                'draft',
                'submitted',
                'kabag_approved',
                'bendahara_checked',
                'katimku_approved',
                'ppk_approved',
                'dicairkan',
                'rejected',
            ])->default('draft');

            // Kabag Umum
            $table->foreignId('kabag_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rekomendasi_kabag')->nullable();

            // Bendahara verifikasi
            $table->foreignId('bendahara_checked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_bendahara')->nullable();

            // Ketua Tim Perencanaan & Keuangan
            $table->foreignId('katimku_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rekomendasi_katimku')->nullable();

            // PPK
            $table->foreignId('ppk_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rekomendasi_ppk')->nullable();

            // Pencairan (Bendahara)
            $table->foreignId('dicairkan_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_pencairan')->nullable();
            $table->timestamp('dicairkan_at')->nullable();

            // Rejection tracking
            $table->string('rejected_by')->nullable(); // 'kabag_umum' | 'ketua_perencanaan' | 'ppk'

            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permohonan_dana');
    }
};
