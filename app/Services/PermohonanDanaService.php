<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PermohonanDana;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PermohonanDanaService
{
    /**
     * Buka kunci permohonan dana (undo status setelah dicairkan/approved).
     * Hanya bisa dipakai saat status bukan draft/rejected,
     * dan tidak boleh jika sudah dicairkan + sudah ada bukti bayar.
     *
     * Untuk status 'dicairkan': dikembalikan ke 'ppk_approved' (bukan rejected).
     * Untuk status lainnya: dikembalikan ke 'rejected'.
     */
    public function bukaKunci(PermohonanDana $pd, User $actor, ?string $alasan): void
    {
        abort_if(in_array($pd->status, ['draft', 'rejected']), 403, 'Permohonan belum terkunci.');
        abort_if($pd->status === 'dicairkan' && $pd->bukti_bayar_path, 403, 'Permohonan sudah ditransfer. Tidak dapat dibuka kunci.');

        DB::transaction(function () use ($pd, $actor, $alasan) {
            // Jika status dicairkan, kembalikan ke ppk_approved (bukan rejected)
            if ($pd->status === 'dicairkan') {
                $pd->update([
                    'status' => 'ppk_approved',
                    'dicairkan_by' => null,
                    'dicairkan_by_name' => null,
                    'dicairkan_by_nip' => null,
                    'dicairkan_at' => null,
                    'catatan_pencairan' => null,
                    'dibuka_kunci_by' => $actor->id,
                    'dibuka_kunci_at' => now(),
                    'dibuka_kunci_by_name' => $actor->nama_lengkap,
                    'alasan_pembukaan_kunci' => $alasan,
                ]);
            } else {
                // Status lain dikembalikan ke rejected
                $pd->update([
                    'status' => 'rejected',
                    'rejected_at_step' => 'dibuka_kunci',
                    'rejected_at' => now(),
                    'catatan_penolakan' => $alasan,
                    'dibuka_kunci_by' => $actor->id,
                    'dibuka_kunci_at' => now(),
                    'dibuka_kunci_by_name' => $actor->nama_lengkap,
                    'alasan_pembukaan_kunci' => $alasan,
                ]);

                $pd->rejections()->create([
                    'rejected_by' => $actor->id,
                    'rejected_at_step' => 'dibuka_kunci',
                    'catatan' => $alasan ?? 'Buka kunci permohonan',
                    'rejected_at' => now(),
                ]);
            }
        });

        $pd->invalidateTerpakaiCache();
    }
}
