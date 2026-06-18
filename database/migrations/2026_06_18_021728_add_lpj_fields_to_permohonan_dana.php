<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->string('lpj_file_path', 500)->nullable()->after('bukti_bayar_uploaded_by_name');
            $table->string('lpj_file_name', 255)->nullable()->after('lpj_file_path');
            $table->timestamp('lpj_uploaded_at')->nullable()->after('lpj_file_name');
            $table->foreignId('lpj_uploaded_by')->nullable()->after('lpj_uploaded_at')->constrained('users')->nullOnDelete();
            $table->string('lpj_uploaded_by_name', 150)->nullable()->after('lpj_uploaded_by');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropForeign(['lpj_uploaded_by']);
            $table->dropColumn(['lpj_file_path', 'lpj_file_name', 'lpj_uploaded_at', 'lpj_uploaded_by', 'lpj_uploaded_by_name']);
        });
    }
};
