<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('perjanjian_kinerja', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_anggaran_id')->constrained('tahun_anggaran')->cascadeOnDelete();
            $table->foreignId('tim_kerja_id')->constrained('tim_kerja')->cascadeOnDelete();
            $table->enum('jenis', ['awal', 'revisi']);
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('draft');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->unique(['tahun_anggaran_id', 'tim_kerja_id', 'jenis']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('perjanjian_kinerja');
    }
};
