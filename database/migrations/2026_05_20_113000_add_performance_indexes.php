<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── permohonan_dana ──────────────────────────────────────────────────────
        // List queries: semua role filter tahun_anggaran_id + status
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->index(['tahun_anggaran_id', 'status'], 'pd_tahun_status_idx');
            $table->index(['tahun_anggaran_id', 'created_by'], 'pd_tahun_creator_idx');
            $table->index(['tahun_anggaran_id', 'tim_kerja_id'], 'pd_tahun_tim_idx');
            $table->index(['status', 'kapokja_id'], 'pd_status_kapokja_idx');
            $table->index(['status', 'pic_keuangan_id'], 'pd_status_pic_idx');
        });

        // ─── permohonan_dana_item ─────────────────────────────────────────────────
        // Load items per ajuan + pagu check (dja_rincian_biaya_id)
        Schema::table('permohonan_dana_item', function (Blueprint $table) {
            $table->index(['permohonan_dana_id', 'dja_rincian_biaya_id'], 'pdi_pd_dja_idx');
        });

        // ─── permohonan_dana_item_nominatif ───────────────────────────────────────
        // Delete all saat simpan + load nominatif per item
        Schema::table('permohonan_dana_item_nominatif', function (Blueprint $table) {
            $table->index('permohonan_dana_id', 'pdn_pd_idx');
            $table->index('permohonan_dana_item_id', 'pdn_pdi_idx');
        });

        // ─── permohonan_dana_rejections ───────────────────────────────────────────
        // Load history rejection per ajuan
        Schema::table('permohonan_dana_rejections', function (Blueprint $table) {
            $table->index('permohonan_dana_id', 'pdr_pd_idx');
        });

        // ─── dja_rincian_biaya ────────────────────────────────────────────────────
        // Load rincian per kegiatan
        Schema::table('dja_rincian_biaya', function (Blueprint $table) {
            $table->index('kegiatan_id', 'drb_kegiatan_idx');
        });

        // ─── users ────────────────────────────────────────────────────────────────
        // Lookup aktor approval (kabag_umum, ppk, dll) — sering dijalankan per request
        // Note: users sudah punya index(role) dan index(is_active) di migration 2026_02_24_015803
        Schema::table('users', function (Blueprint $table) {
            $table->index(['role', 'pimpinan_type', 'is_active'], 'users_role_pimpinan_active_idx');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropIndex('pd_tahun_status_idx');
            $table->dropIndex('pd_tahun_creator_idx');
            $table->dropIndex('pd_tahun_tim_idx');
            $table->dropIndex('pd_status_kapokja_idx');
            $table->dropIndex('pd_status_pic_idx');
        });

        Schema::table('permohonan_dana_item', function (Blueprint $table) {
            $table->dropIndex('pdi_pd_dja_idx');
        });

        Schema::table('permohonan_dana_item_nominatif', function (Blueprint $table) {
            $table->dropIndex('pdn_pd_idx');
            $table->dropIndex('pdn_pdi_idx');
        });

        Schema::table('permohonan_dana_rejections', function (Blueprint $table) {
            $table->dropIndex('pdr_pd_idx');
        });

        Schema::table('dja_rincian_biaya', function (Blueprint $table) {
            $table->dropIndex('drb_kegiatan_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_pimpinan_active_idx');
        });
    }
};
