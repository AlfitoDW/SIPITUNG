<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dja_revisi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_anggaran_id')->constrained('tahun_anggaran')->restrictOnDelete();
            $table->unsignedInteger('nomor_revisi');
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->text('catatan')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['tahun_anggaran_id', 'nomor_revisi']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dja_revisi');
    }
};
