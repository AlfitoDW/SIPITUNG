<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            // Sprint 1: Kapokja snapshot
            $table->string('kapokja_name')->nullable()->after('pic_approved_by_nip');
            $table->string('kapokja_nip', 30)->nullable()->after('kapokja_name');

            // Sprint 1: PIC Keuangan snapshot
            $table->string('pic_keuangan_name')->nullable()->after('kapokja_nip');
            $table->string('pic_keuangan_nip', 30)->nullable()->after('pic_keuangan_name');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropColumn('pic_keuangan_nip');
            $table->dropColumn('pic_keuangan_name');
            $table->dropColumn('kapokja_nip');
            $table->dropColumn('kapokja_name');
        });
    }
};
