<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dja_revisi_detail', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dja_revisi_id')->constrained('dja_revisi')->cascadeOnDelete();
            $table->string('level', 30);       // program / sasaran / kro / ro / komponen / kegiatan / rincian_biaya
            $table->string('kode_item', 400);    // kode unik item di level-nya
            $table->string('parent_kode', 500)->nullable(); // kode parent
            $table->string('nama_item', 400)->nullable();
            $table->enum('jenis_perubahan', ['tambah', 'ubah', 'hapus', 'realokasi']);
            $table->decimal('pagu_lama', 15, 2)->nullable();
            $table->decimal('pagu_baru', 15, 2)->nullable();
            $table->string('status_eksekusi', 30)->nullable(); // sukses / gagal_hapus_terikat / skip_anomali
            $table->text('keterangan')->nullable();

            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dja_revisi_detail');
    }
};
