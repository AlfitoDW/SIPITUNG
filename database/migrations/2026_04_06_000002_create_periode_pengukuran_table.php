<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periode_pengukuran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_anggaran_id')->constrained('tahun_anggaran')->cascadeOnDelete();
            $table->enum('triwulan', ['TW1', 'TW2', 'TW3', 'TW4']);
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_selesai')->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            $table->unique(['tahun_anggaran_id', 'triwulan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periode_pengukuran');
    }
};