<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate existing date-only values to end-of-day before changing column type
        \Illuminate\Support\Facades\DB::table('periode_pengukuran')
            ->whereNotNull('tanggal_selesai')
            ->get()
            ->each(function ($row) {
                if (strlen((string) $row->tanggal_selesai) <= 10) {
                    \Illuminate\Support\Facades\DB::table('periode_pengukuran')
                        ->where('id', $row->id)
                        ->update(['tanggal_selesai' => $row->tanggal_selesai . ' 23:59:59']);
                }
            });

        Schema::table('periode_pengukuran', function (Blueprint $table) {
            $table->dateTime('tanggal_selesai')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('periode_pengukuran', function (Blueprint $table) {
            $table->date('tanggal_selesai')->nullable()->change();
        });
    }
};
