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
        Schema::table('rencana_aksi', function (Blueprint $table) {
            $table->text('rekomendasi_kabag')->nullable()->after('status');
            $table->text('rekomendasi_ppk')->nullable()->after('rekomendasi_kabag');
            $table->string('rejected_by')->nullable()->after('rekomendasi_ppk');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rencana_aksi', function (Blueprint $table) {
            $table->dropColumn(['rekomendasi_kabag', 'rekomendasi_ppk', 'rejected_by']);
        });
    }
};
