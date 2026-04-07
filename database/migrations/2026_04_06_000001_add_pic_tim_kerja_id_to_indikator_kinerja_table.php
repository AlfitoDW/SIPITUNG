<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('indikator_kinerja', function (Blueprint $table) {
            $table->foreignId('pic_tim_kerja_id')
                ->nullable()
                ->after('urutan')
                ->constrained('tim_kerja')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('indikator_kinerja', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\TimKerja::class, 'pic_tim_kerja_id');
            $table->dropColumn('pic_tim_kerja_id');
        });
    }
};