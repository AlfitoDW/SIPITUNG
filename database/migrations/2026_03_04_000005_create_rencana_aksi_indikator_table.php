<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rencana_aksi_indikator', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rencana_aksi_id')->constrained('rencana_aksi')->cascadeOnDelete();
            $table->string('kode', 20);
            $table->text('nama');
            $table->string('satuan', 50);
            $table->string('target', 50);
            $table->string('target_tw1', 50)->nullable();
            $table->string('target_tw2', 50)->nullable();
            $table->string('target_tw3', 50)->nullable();
            $table->string('target_tw4', 50)->nullable();
            $table->unsignedSmallInteger('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rencana_aksi_indikator');
    }
};
