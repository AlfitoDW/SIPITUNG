<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permohonan_dana_item', function (Blueprint $table) {
            $table->decimal('jumlah_permintaan', 15, 2)->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana_item', function (Blueprint $table) {
            $table->unsignedBigInteger('jumlah_permintaan')->default(0)->change();
        });
    }
};
