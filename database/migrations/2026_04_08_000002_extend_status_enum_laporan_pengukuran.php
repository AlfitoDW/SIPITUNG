<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite tidak enforce enum, hanya MySQL yang perlu diubah
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE laporan_pengukuran MODIFY COLUMN status ENUM('draft','submitted','kabag_approved','rejected') NOT NULL DEFAULT 'draft'");
        }
    }

    public function down(): void
    {
        // Tidak di-rollback ke ENUM yang lebih kecil karena akan menyebabkan
        // "Data truncated" error jika tabel sudah berisi data kabag_approved/rejected.
        // down() dibiarkan no-op; jika perlu fresh install gunakan migrate:fresh.
    }
};
