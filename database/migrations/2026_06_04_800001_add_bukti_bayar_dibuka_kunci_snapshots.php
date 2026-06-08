<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->string('bukti_bayar_uploaded_by_name')->nullable()->after('bukti_bayar_uploaded_by');
            $table->string('dibuka_kunci_by_name')->nullable()->after('dibuka_kunci_by');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropColumn('dibuka_kunci_by_name');
            $table->dropColumn('bukti_bayar_uploaded_by_name');
        });
    }
};
