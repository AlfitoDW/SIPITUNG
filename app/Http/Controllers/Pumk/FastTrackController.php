<?php

namespace App\Http\Controllers\Pumk;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FastTrackController extends Controller
{
    /**
     * Fast-track approval: submitted → dicairkan in one go.
     * Bypasses KA.TIM → PIC → PPK → Bendahara individually.
     */
    public function approveToPic(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403, 'Hanya pembuat permohonan yang dapat melakukan fast-track.');
        abort_if($pd->status !== 'submitted', 422, 'Status permohonan harus "Diajukan" untuk fast-track.');

        DB::transaction(function () use ($pd) {
            $fresh = PermohonanDana::lockForUpdate()->find($pd->id);
            abort_if($fresh->status !== 'submitted', 409, 'Status permohonan berubah, silakan refresh halaman.');

            $kapokja = User::find($fresh->kapokja_id);
            $pic = User::find($fresh->pic_keuangan_id);
            $ppk = User::where('role', 'pimpinan')
                ->where('pimpinan_type', 'ppk')
                ->where('is_active', true)
                ->first();
            $bendahara = User::where('role', 'bendahara')
                ->where('is_active', true)
                ->first();

            $fresh->update([
                'status' => 'dicairkan',
                'katim_approved_by' => $kapokja?->id,
                'katim_approved_by_name' => $kapokja?->nama_lengkap,
                'katim_approved_by_nip' => $kapokja?->nip,
                'katim_approved_at' => now(),
                'pic_approved_by' => $pic?->id,
                'pic_approved_by_name' => $pic?->nama_lengkap,
                'pic_approved_by_nip' => $pic?->nip,
                'pic_approved_at' => now(),
                'ppk_approved_by' => $ppk?->id,
                'ppk_approved_by_name' => $ppk?->nama_lengkap,
                'ppk_approved_by_nip' => $ppk?->nip,
                'ppk_approved_at' => now(),
                'dicairkan_by' => $bendahara?->id,
                'dicairkan_by_name' => $bendahara?->nama_lengkap,
                'dicairkan_by_nip' => $bendahara?->nip,
                'dicairkan_at' => now(),
            ]);
        });

        $pd->invalidateTerpakaiCache();

        return redirect()->route('pumk.permohonan-dana.index')
            ->with('success', "Permohonan {$pd->nomor_permohonan} fast-track disetujui sampai dicairkan.");
    }
}
