<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // tgl_nominatif di permohonan_dana
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->date('tgl_nominatif')->nullable()->after('dicairkan_at');
        });

        // tipe_nominatif di permohonan_dana_item
        Schema::table('permohonan_dana_item', function (Blueprint $table) {
            $table->enum('tipe_nominatif', ['honor', 'perjadin', 'non_nominatif'])
                  ->default('non_nominatif')
                  ->after('keterangan');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropColumn('tgl_nominatif');
        });

        Schema::table('permohonan_dana_item', function (Blueprint $table) {
            $table->dropColumn('tipe_nominatif');
        });
    }
};
