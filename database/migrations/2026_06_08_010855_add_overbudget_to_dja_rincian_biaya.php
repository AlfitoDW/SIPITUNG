<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dja_rincian_biaya', function (Blueprint $table) {
            $table->boolean('overbudget_flag')->default(false)->after('is_aktif');
        });
    }

    public function down(): void
    {
        Schema::table('dja_rincian_biaya', function (Blueprint $table) {
            $table->dropColumn('overbudget_flag');
        });
    }
};
