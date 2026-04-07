<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('laporan_pengukuran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tim_kerja_id')->constrained('tim_kerja')->cascadeOnDelete();
            $table->foreignId('periode_pengukuran_id')->constrained('periode_pengukuran')->cascadeOnDelete();
            $table->enum('status', ['draft', 'submitted'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['tim_kerja_id', 'periode_pengukuran_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('laporan_pengukuran');
    }
};
