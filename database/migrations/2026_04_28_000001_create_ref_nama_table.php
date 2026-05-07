<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ref_nama', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 150);
            $table->string('nip', 30)->nullable()->unique();
            $table->string('nik', 20)->nullable();
            $table->string('npwp', 20)->nullable();
            $table->string('gol_ruang', 10)->nullable();  // II/a, III/b, IV/a, ...
            $table->enum('status_kepegawaian', ['PNS', 'Non-PNS'])->default('PNS');
            $table->string('nama_rekening', 150)->nullable();
            $table->string('no_rekening', 30)->nullable();
            $table->string('nama_bank', 100)->nullable();
            $table->string('email', 150)->nullable();
            $table->decimal('pph21_persen', 5, 2)->default(0);  // Tarif PPh21 (%)
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ref_nama');
    }
};
