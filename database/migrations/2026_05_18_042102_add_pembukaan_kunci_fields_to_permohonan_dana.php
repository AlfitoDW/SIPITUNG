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
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->foreignId('dibuka_kunci_by')->nullable()->constrained('users');
            $table->timestamp('dibuka_kunci_at')->nullable();
            $table->text('alasan_pembukaan_kunci')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropForeign(['dibuka_kunci_by']);
            $table->dropColumn(['dibuka_kunci_by', 'dibuka_kunci_at', 'alasan_pembukaan_kunci']);
        });
    }
};
