<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('realisasi_kinerja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('indikator_kinerja_id')->constrained('indikator_kinerja')->cascadeOnDelete();
            $table->foreignId('periode_pengukuran_id')->constrained('periode_pengukuran')->cascadeOnDelete();
            // Siapa yang mengisi duluan (first-come locks it)
            $table->foreignId('input_by_tim_kerja_id')->nullable()->constrained('tim_kerja')->nullOnDelete();
            $table->string('realisasi', 100)->nullable();
            $table->text('progress_kegiatan')->nullable();
            $table->text('kendala')->nullable();
            $table->text('strategi_tindak_lanjut')->nullable();
            // Catatan koordinasi (opsional, bisa diisi oleh yang mengisi)
            $table->text('catatan')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            // Satu nilai resmi per IKU per periode — siapapun yang isi duluan, mengunci bagi PIC lain
            $table->unique(['indikator_kinerja_id', 'periode_pengukuran_id'], 'realisasi_kinerja_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('realisasi_kinerja');
    }
};
