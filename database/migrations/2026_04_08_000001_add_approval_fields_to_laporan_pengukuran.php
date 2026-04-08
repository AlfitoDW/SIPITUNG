<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('laporan_pengukuran', function (Blueprint $table) {
            $table->text('rekomendasi_kabag')->nullable()->after('submitted_by');
            $table->timestamp('approved_at')->nullable()->after('rekomendasi_kabag');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete()->after('approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('laporan_pengukuran', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['rekomendasi_kabag', 'approved_at', 'approved_by']);
        });
    }
};
