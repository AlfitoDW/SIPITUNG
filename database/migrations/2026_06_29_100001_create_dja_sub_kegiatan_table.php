<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── Create dja_sub_kegiatan table ────────────────────────────────────────
        Schema::create('dja_sub_kegiatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kegiatan_id')->constrained('dja_kegiatan')->cascadeOnDelete();
            $table->string('kode_akun', 10);               // '521213','522151','524113'
            $table->string('nama_akun', 150);              // 'Belanja Honor Output Kegiatan'
            $table->unsignedBigInteger('pagu')->default(0);
            $table->unsignedInteger('urutan')->default(0);
            $table->boolean('is_aktif')->default(true);
            $table->timestamps();

            // Index untuk query sub kegiatan per kegiatan
            $table->index('kegiatan_id', 'dsk_kegiatan_idx');
            // Unique constraint untuk mencegah duplikasi akun per kegiatan
            $table->unique(['kegiatan_id', 'kode_akun', 'nama_akun'], 'dsk_kegiatan_akun_unique');
        });

        // ─── Backfill sub_kegiatan dari data existing ─────────────────────────────
        // Group existing rincian biaya by kegiatan_id + kode_akun + nama_akun
        $groups = DB::table('dja_rincian_biaya')
            ->select('kegiatan_id', 'kode_akun', 'nama_akun')
            ->where('is_aktif', true)
            ->groupBy('kegiatan_id', 'kode_akun', 'nama_akun')
            ->get();

        foreach ($groups as $idx => $group) {
            // Hitung pagu sub kegiatan dari sum rincian biaya
            $paguSubKegiatan = DB::table('dja_rincian_biaya')
                ->where('kegiatan_id', $group->kegiatan_id)
                ->where('kode_akun', $group->kode_akun)
                ->where('nama_akun', $group->nama_akun)
                ->sum('pagu_total');

            // Insert sub kegiatan
            DB::table('dja_sub_kegiatan')->insert([
                'kegiatan_id' => $group->kegiatan_id,
                'kode_akun' => $group->kode_akun,
                'nama_akun' => $group->nama_akun,
                'pagu' => $paguSubKegiatan,
                'urutan' => $idx + 1,
                'is_aktif' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ─── Add sub_kegiatan_id to dja_rincian_biaya ────────────────────────────
        Schema::table('dja_rincian_biaya', function (Blueprint $table) {
            $table->foreignId('sub_kegiatan_id')
                ->nullable()
                ->after('id')
                ->constrained('dja_sub_kegiatan')
                ->cascadeOnDelete();
        });

        // ─── Populate sub_kegiatan_id ─────────────────────────────────────────────
        $rincians = DB::table('dja_rincian_biaya')->get();

        foreach ($rincians as $rincian) {
            $subKegiatan = DB::table('dja_sub_kegiatan')
                ->where('kegiatan_id', $rincian->kegiatan_id)
                ->where('kode_akun', $rincian->kode_akun)
                ->where('nama_akun', $rincian->nama_akun)
                ->first();

            if ($subKegiatan) {
                DB::table('dja_rincian_biaya')
                    ->where('id', $rincian->id)
                    ->update(['sub_kegiatan_id' => $subKegiatan->id]);
            }
        }

        // ─── Drop old columns from dja_rincian_biaya ─────────────────────────────
        Schema::table('dja_rincian_biaya', function (Blueprint $table) {
            $table->dropIndex('drb_kegiatan_idx');
            $table->dropForeign(['kegiatan_id']);
            $table->dropColumn(['kegiatan_id', 'kode_akun', 'nama_akun']);
        });

        // ─── Add new index for sub_kegiatan_id ───────────────────────────────────
        Schema::table('dja_rincian_biaya', function (Blueprint $table) {
            $table->index('sub_kegiatan_id', 'drb_sub_kegiatan_idx');
        });
    }

    public function down(): void
    {
        // ─── Restore old structure ────────────────────────────────────────────────
        Schema::table('dja_rincian_biaya', function (Blueprint $table) {
            // Add back old columns
            $table->foreignId('kegiatan_id')->nullable()->after('id')->constrained('dja_kegiatan')->cascadeOnDelete();
            $table->string('kode_akun', 10)->nullable()->after('kegiatan_id');
            $table->string('nama_akun', 150)->nullable()->after('kode_akun');
        });

        // Populate old columns from sub_kegiatan
        $rincians = DB::table('dja_rincian_biaya')->get();
        foreach ($rincians as $rincian) {
            if ($rincian->sub_kegiatan_id) {
                $subKegiatan = DB::table('dja_sub_kegiatan')->where('id', $rincian->sub_kegiatan_id)->first();
                if ($subKegiatan) {
                    DB::table('dja_rincian_biaya')
                        ->where('id', $rincian->id)
                        ->update([
                            'kegiatan_id' => $subKegiatan->kegiatan_id,
                            'kode_akun' => $subKegiatan->kode_akun,
                            'nama_akun' => $subKegiatan->nama_akun,
                        ]);
                }
            }
        }

        Schema::table('dja_rincian_biaya', function (Blueprint $table) {
            $table->dropIndex('drb_sub_kegiatan_idx');
            $table->dropForeign(['sub_kegiatan_id']);
            $table->dropColumn('sub_kegiatan_id');
            $table->index('kegiatan_id', 'drb_kegiatan_idx');
        });

        Schema::dropIfExists('dja_sub_kegiatan');
    }
};
