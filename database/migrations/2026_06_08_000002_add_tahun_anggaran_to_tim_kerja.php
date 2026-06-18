<?php

use App\Models\TahunAnggaran;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tim_kerja', function (Blueprint $table) {
            $table->foreignId('tahun_anggaran_id')->nullable()->after('is_active')
                ->constrained('tahun_anggaran')->nullOnDelete();
            $table->index(['tahun_anggaran_id', 'is_active']);
        });

        // Seed: set existing tim_kerja to default tahun
        $defaultTahun = TahunAnggaran::where('is_default', true)->first()
            ?? TahunAnggaran::orderBy('tahun', 'desc')->first();

        if ($defaultTahun) {
            DB::table('tim_kerja')->whereNull('tahun_anggaran_id')
                ->update(['tahun_anggaran_id' => $defaultTahun->id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tim_kerja', function (Blueprint $table) {
            $table->dropIndex(['tahun_anggaran_id', 'is_active']);
            $table->dropForeign(['tahun_anggaran_id']);
            $table->dropColumn('tahun_anggaran_id');
        });
    }
};
