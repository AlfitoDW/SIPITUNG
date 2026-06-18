<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Ubah PD berstatus kabag_approved (legacy flow) ke pic_approved (new flow).
     * Di flow lama: KA.TIM → Kabag → PPK → PIC → Bendahara
     * Di flow baru: KA.TIM → PIC → PPK → Bendahara
     *
     * PD yang sebelumnya sudah di-approve Kabag (berarti KA.TIM sudah approve)
     * langsung naik ke pic_approved agar bisa dilanjutkan oleh PPK.
     * Kabag di flow baru bersifat view-only.
     */
    public function up(): void
    {
        DB::table('permohonan_dana')
            ->where('status', 'kabag_approved')
            ->update(['status' => 'pic_approved']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak ada rollback — data sudah berubah secara searah
    }
};
