<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah snapshot kolom created_by_name dan created_by_nip
     * pada permohonan_dana untuk audit trail PUMK pembuat SPJ.
     */
    public function up(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->string('created_by_name', 150)->nullable()->after('created_by');
            $table->string('created_by_nip', 30)->nullable()->after('created_by_name');
        });
    }

    public function down(): void
    {
        Schema::table('permohonan_dana', function (Blueprint $table) {
            $table->dropColumn(['created_by_name', 'created_by_nip']);
        });
    }
};
