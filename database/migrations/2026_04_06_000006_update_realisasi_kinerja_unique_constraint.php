<?php

use Illuminate\Database\Migrations\Migration;

// Unique constraint sudah diatur langsung di _003 (input_by_tim_kerja_id + catatan).
// Migration ini tidak melakukan apa-apa dan dipertahankan agar urutan migration tidak berubah.
return new class extends Migration
{
    public function up(): void {}

    public function down(): void {}
};
