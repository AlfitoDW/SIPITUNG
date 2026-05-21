<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dja_rincian_biaya', function (Blueprint $table) {
            $table->decimal('harga_satuan', 15, 2)->default(0)->change();
            $table->decimal('pagu_total', 15, 2)->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('dja_rincian_biaya', function (Blueprint $table) {
            $table->unsignedBigInteger('harga_satuan')->default(0)->change();
            $table->unsignedBigInteger('pagu_total')->default(0)->change();
        });
    }
};
