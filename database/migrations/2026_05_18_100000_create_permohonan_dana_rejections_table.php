<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permohonan_dana_rejections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permohonan_dana_id')->constrained('permohonan_dana')->cascadeOnDelete();
            $table->foreignId('rejected_by')->constrained('users')->cascadeOnDelete();
            $table->string('rejected_at_step'); // katim, kabag, ppk, pic, bendahara
            $table->text('catatan');
            $table->timestamp('rejected_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permohonan_dana_rejections');
    }
};
