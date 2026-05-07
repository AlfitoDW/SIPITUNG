<?php

namespace App\Http\Controllers\PicKeuangan;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * PIC Keuangan — Approval Step 4
 *
 * ppk_approved → pic_approved  (atau rejected)
 */
class PermohonanDanaController extends Controller
{
    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $menunggu = PermohonanDana::with(['items', 'timKerja', 'createdBy'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', 'ppk_approved')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($pd) => array_merge($pd->toArray(), ['status_label' => $pd->status_label]));

        $riwayat = PermohonanDana::with(['items', 'timKerja', 'createdBy'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('pic_approved_by', auth()->id())
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn ($pd) => array_merge($pd->toArray(), ['status_label' => $pd->status_label]));

        return Inertia::render('PicKeuangan/PermohonanDana/Index', [
            'tahun'    => $tahun,
            'menunggu' => $menunggu,
            'riwayat'  => $riwayat,
        ]);
    }

    public function approve(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'ppk_approved', 422, 'Status tidak valid.');

        $request->validate(['catatan' => 'nullable|string|max:1000']);

        $pd->update([
            'status'          => 'pic_approved',
            'pic_approved_by' => $request->user()->id,
            'catatan_pic'     => $request->catatan,
            'pic_approved_at' => now(),
        ]);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} diverifikasi, diteruskan ke Bendahara untuk pencairan.");
    }

    public function reject(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'ppk_approved', 422, 'Status tidak valid.');

        $request->validate(['catatan' => 'required|string|max:1000']);

        $pd->update([
            'status'            => 'rejected',
            'pic_approved_by'   => $request->user()->id,
            'catatan_pic'       => $request->catatan,
            'pic_approved_at'   => now(),
            'rejected_at_step'  => 'pic',
            'catatan_penolakan' => $request->catatan,
            'rejected_at'       => now(),
        ]);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} ditolak.");
    }
}
