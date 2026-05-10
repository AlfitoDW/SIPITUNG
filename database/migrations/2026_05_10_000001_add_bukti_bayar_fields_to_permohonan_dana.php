<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->string('bukti_bayar_path')->nullable()->after('dicairkan_at');
            $table->timestamp('bukti_bayar_uploaded_at')->nullable()->after('bukti_bayar_path');
            $table->foreignId('bukti_bayar_uploaded_by')->nullable()->constrained('users')->after('bukti_bayar_uploaded_at');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropForeign(['bukti_bayar_uploaded_by']);
            $table->dropColumn(['bukti_bayar_path', 'bukti_bayar_uploaded_at', 'bukti_bayar_uploaded_by']);
        });
    }
};
