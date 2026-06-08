<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permohonan_dana_item', function (Blueprint $table) {
            $table->decimal('pagu_rincian_snapshot', 15, 2)->nullable()->after('jumlah_permintaan');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana_item', function (Blueprint $table) {
            $table->dropColumn('pagu_rincian_snapshot');
        });
    }
};
