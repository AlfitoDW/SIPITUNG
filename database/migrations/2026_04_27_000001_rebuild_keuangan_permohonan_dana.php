<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop is_koordinator from tim_kerja (no longer needed)
        if (Schema::hasColumn('tim_kerja', 'is_koordinator')) {
            Schema::table('tim_kerja', function (Blueprint $table) {
                $table->dropColumn('is_koordinator');
            });
        }

        // Drop old tables if they exist (from old keuangan implementation)
        Schema::dropIfExists('permohonan_dana_item');
        Schema::dropIfExists('permohonan_dana');

        // ─── Permohonan Dana ─────────────────────────────────────────────────────
        // Approval flow: draft → submitted → katim_approved → kabag_approved
        //                → ppk_approved → pic_approved → dicairkan
        //                (rejected from any step)
        Schema::create('permohonan_dana', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tahun_anggaran_id')->constrained('tahun_anggaran')->cascadeOnDelete();
            $table->foreignId('tim_kerja_id')->constrained('tim_kerja')->cascadeOnDelete();

            $table->string('nomor_permohonan')->unique();
            $table->string('keperluan');
            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->string('tempat')->nullable();

            // Surat Keputusan & Surat Tugas (opsional, bisa diisi setelah dibuat)
            $table->string('no_sk')->nullable();
            $table->date('tgl_sk')->nullable();
            $table->string('no_st')->nullable();
            $table->date('tgl_st')->nullable();

            $table->text('keterangan')->nullable();
            $table->decimal('total_anggaran', 15, 2)->default(0);

            $table->enum('status', [
                'draft',
                'submitted',
                'katim_approved',
                'kabag_approved',
                'ppk_approved',
                'pic_approved',
                'dicairkan',
                'rejected',
            ])->default('draft');

            // Step 1 — KA.TIM (ketua_tim_kerja pokja ybs)
            $table->foreignId('katim_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_katim')->nullable();

            // Step 2 — Kabag Umum (pimpinan kabag_umum)
            $table->foreignId('kabag_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_kabag')->nullable();

            // Step 3 — PPK (pimpinan ppk)
            $table->foreignId('ppk_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_ppk')->nullable();

            // Step 4 — PIC Keuangan
            $table->foreignId('pic_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_pic')->nullable();

            // Step 5 — Bendahara (pencairan)
            $table->foreignId('dicairkan_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('catatan_pencairan')->nullable();
            $table->timestamp('dicairkan_at')->nullable();

            // Rejection tracking
            $table->string('rejected_at_step')->nullable(); // katim|kabag|ppk|pic
            $table->text('catatan_penolakan')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        // ─── Permohonan Dana Item ─────────────────────────────────────────────────
        Schema::create('permohonan_dana_item', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permohonan_dana_id')->constrained('permohonan_dana')->cascadeOnDelete();

            // Kode akun belanja (contoh: 521111, 521213, 524111, dst.)
            $table->string('kode_akun', 10)->nullable();
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
        Schema::dropIfExists('permohonan_dana');

        if (! Schema::hasColumn('tim_kerja', 'is_koordinator')) {
            Schema::table('tim_kerja', function (Blueprint $table) {
                $table->boolean('is_koordinator')->default(false)->after('is_active');
            });
        }
    }
};
