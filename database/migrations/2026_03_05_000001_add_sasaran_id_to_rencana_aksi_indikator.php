<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rencana_aksi_indikator', function (Blueprint $table) {
            $table->foreignId('sasaran_id')
                ->nullable()
                ->after('rencana_aksi_id')
                ->constrained('sasaran')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('rencana_aksi_indikator', function (Blueprint $table) {
            $table->dropForeign(['sasaran_id']);
            $table->dropColumn('sasaran_id');
        });
    }
};
