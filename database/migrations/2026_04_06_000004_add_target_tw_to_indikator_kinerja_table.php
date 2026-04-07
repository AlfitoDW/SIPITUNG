<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('indikator_kinerja', function (Blueprint $table) {
            $table->string('target_tw1', 50)->nullable()->after('target');
            $table->string('target_tw2', 50)->nullable()->after('target_tw1');
            $table->string('target_tw3', 50)->nullable()->after('target_tw2');
            $table->string('target_tw4', 50)->nullable()->after('target_tw3');
        });
    }

    public function down(): void
    {
        Schema::table('indikator_kinerja', function (Blueprint $table) {
            $table->dropColumn(['target_tw1', 'target_tw2', 'target_tw3', 'target_tw4']);
        });
    }
};
