<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permohonan_dana_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permohonan_dana_id')->constrained('permohonan_dana')->cascadeOnDelete();
            $table->string('uraian');
            $table->decimal('volume', 10, 2);
            $table->string('satuan', 50);
            $table->decimal('harga_satuan', 15, 2);
            $table->decimal('total', 15, 2);
            $table->string('keterangan')->nullable();
            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permohonan_dana_item');
    }
};
