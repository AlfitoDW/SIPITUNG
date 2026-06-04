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
     * Fast-track approval: submitted → pic_approved in one go.
     * Bypasses KA.TIM → Kabag → PPK → PIC individually.
     */
    public function approveToPic(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403, 'Hanya pembuat permohonan yang dapat melakukan fast-track.');
        abort_if($pd->status !== 'submitted', 422, 'Status permohonan harus "Diajukan" untuk fast-track.');

        DB::transaction(function () use ($pd) {
            $fresh = PermohonanDana::lockForUpdate()->find($pd->id);
            abort_if($fresh->status !== 'submitted', 409, 'Status permohonan berubah, silakan refresh halaman.');

            $kapokja = User::find($fresh->kapokja_id);
            $kabag = User::where('role', 'pimpinan')
                ->where('pimpinan_type', 'kabag_umum')
                ->where('is_active', true)
                ->first();
            $ppk = User::where('role', 'pimpinan')
                ->where('pimpinan_type', 'ppk')
                ->where('is_active', true)
                ->first();
            $pic = User::find($fresh->pic_keuangan_id);

            $fresh->update([
                'status' => 'pic_approved',
                'katim_approved_by' => $kapokja?->id,
                'katim_approved_at' => now(),
                'kabag_approved_by' => $kabag?->id,
                'kabag_approved_at' => now(),
                'ppk_approved_by' => $ppk?->id,
                'ppk_approved_at' => now(),
                'pic_approved_by' => $pic?->id,
                'pic_approved_at' => now(),
            ]);
        });

        $pd->invalidateTerpakaiCache();

        return redirect()->route('pumk.permohonan-dana.index')
            ->with('success', "Permohonan {$pd->nomor_permohonan} telah disetujui sampai PIC Keuangan.");
    }
}
