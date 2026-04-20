<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rencana_kegiatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rencana_aksi_indikator_id')->constrained('rencana_aksi_indikator')->cascadeOnDelete();
            $table->tinyInteger('triwulan')->unsigned(); // 1–4
            $table->unsignedSmallInteger('urutan')->default(0);
            $table->text('nama_kegiatan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rencana_kegiatan');
    }
};
