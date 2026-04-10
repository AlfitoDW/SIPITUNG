<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `perjanjian_kinerja` MODIFY `status` ENUM('draft','submitted','kabag_approved','ppk_approved','rejected') NOT NULL DEFAULT 'draft'");
        DB::statement("ALTER TABLE `rencana_aksi` MODIFY `status` ENUM('draft','submitted','kabag_approved','ppk_approved','rejected') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        // Tidak di-rollback ke ENUM yang lebih kecil karena akan menyebabkan
        // "Data truncated" error jika tabel sudah berisi data kabag_approved/ppk_approved.
        // down() dibiarkan no-op; jika perlu fresh install gunakan migrate:fresh.
    }
};
