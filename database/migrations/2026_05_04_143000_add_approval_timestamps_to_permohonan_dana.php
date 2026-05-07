<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            // Timestamp saat PUMK mengajukan (submitted)
            $table->timestamp('submitted_at')->nullable()->after('status');

            // Timestamp per step approval
            $table->timestamp('katim_approved_at')->nullable()->after('catatan_katim');
            $table->timestamp('kabag_approved_at')->nullable()->after('catatan_kabag');
            $table->timestamp('ppk_approved_at')->nullable()->after('catatan_ppk');
            $table->timestamp('pic_approved_at')->nullable()->after('catatan_pic');

            // Timestamp saat ditolak
            $table->timestamp('rejected_at')->nullable()->after('catatan_penolakan');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropColumn([
                'submitted_at',
                'katim_approved_at',
                'kabag_approved_at',
                'ppk_approved_at',
                'pic_approved_at',
                'rejected_at',
            ]);
        });
    }
};
