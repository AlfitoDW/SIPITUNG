<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tahun_anggaran', function (Blueprint $table) {
            $table->dateTime('batas_pengisian_ra')->nullable()->after('is_default');
        });
    }

    public function down(): void
    {
        Schema::table('tahun_anggaran', function (Blueprint $table) {
            $table->dropColumn('batas_pengisian_ra');
        });
    }
};
