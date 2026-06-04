<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom snapshot nama & NIP untuk setiap approver step.
     * Ubah FK constraint dari nullOnDelete ke restrictOnDelete
     * agar user yang pernah approve tidak bisa dihapus.
     */
    public function up(): void
    {
        // ─── Snapshot columns ──────────────────────────────────────────────────
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->string('katim_approved_by_name')->nullable()->after('katim_approved_by');
            $table->string('katim_approved_by_nip')->nullable()->after('katim_approved_by_name');

            $table->string('kabag_approved_by_name')->nullable()->after('kabag_approved_by');
            $table->string('kabag_approved_by_nip')->nullable()->after('kabag_approved_by_name');

            $table->string('ppk_approved_by_name')->nullable()->after('ppk_approved_by');
            $table->string('ppk_approved_by_nip')->nullable()->after('ppk_approved_by_name');

            $table->string('pic_approved_by_name')->nullable()->after('pic_approved_by');
            $table->string('pic_approved_by_nip')->nullable()->after('pic_approved_by_name');

            $table->string('dicairkan_by_name')->nullable()->after('dicairkan_by');
            $table->string('dicairkan_by_nip')->nullable()->after('dicairkan_by_name');
        });

        // ─── FK constraints: nullOnDelete → restrictOnDelete ───────────────────
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropForeign(['katim_approved_by']);
            $table->foreign('katim_approved_by')
                ->references('id')->on('users')
                ->restrictOnDelete();

            $table->dropForeign(['kabag_approved_by']);
            $table->foreign('kabag_approved_by')
                ->references('id')->on('users')
                ->restrictOnDelete();

            $table->dropForeign(['ppk_approved_by']);
            $table->foreign('ppk_approved_by')
                ->references('id')->on('users')
                ->restrictOnDelete();

            $table->dropForeign(['pic_approved_by']);
            $table->foreign('pic_approved_by')
                ->references('id')->on('users')
                ->restrictOnDelete();

            $table->dropForeign(['dicairkan_by']);
            $table->foreign('dicairkan_by')
                ->references('id')->on('users')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        // Revert FK constraints: restrictOnDelete → nullOnDelete
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropForeign(['katim_approved_by']);
            $table->foreign('katim_approved_by')
                ->references('id')->on('users')
                ->nullOnDelete();

            $table->dropForeign(['kabag_approved_by']);
            $table->foreign('kabag_approved_by')
                ->references('id')->on('users')
                ->nullOnDelete();

            $table->dropForeign(['ppk_approved_by']);
            $table->foreign('ppk_approved_by')
                ->references('id')->on('users')
                ->nullOnDelete();

            $table->dropForeign(['pic_approved_by']);
            $table->foreign('pic_approved_by')
                ->references('id')->on('users')
                ->nullOnDelete();

            $table->dropForeign(['dicairkan_by']);
            $table->foreign('dicairkan_by')
                ->references('id')->on('users')
                ->nullOnDelete();
        });

        // Drop snapshot columns
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropColumn([
                'katim_approved_by_name', 'katim_approved_by_nip',
                'kabag_approved_by_name', 'kabag_approved_by_nip',
                'ppk_approved_by_name', 'ppk_approved_by_nip',
                'pic_approved_by_name', 'pic_approved_by_nip',
                'dicairkan_by_name', 'dicairkan_by_nip',
            ]);
        });
    }
};
