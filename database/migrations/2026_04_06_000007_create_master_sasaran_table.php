<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_sasaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_anggaran_id')->constrained('tahun_anggaran')->cascadeOnDelete();
            $table->string('kode', 10);
            $table->string('nama');
            $table->unsignedTinyInteger('urutan')->default(1);
            $table->timestamps();

            $table->unique(['tahun_anggaran_id', 'kode']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_sasaran');
    }
};
