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
            // Drop FK dengan nama eksplisit yang dibuat Laravel saat up()
            $table->dropForeign('indikator_kinerja_pic_tim_kerja_id_foreign');
            $table->dropColumn('pic_tim_kerja_id');
        });
    }
};