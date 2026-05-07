<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pimpinan — Approval Step 2 (Kabag Umum) & Step 3 (PPK)
 *
 * Kabag Umum: katim_approved → kabag_approved
 * PPK:        kabag_approved → ppk_approved
 */
class PermohonanDanaController extends Controller
{
    private function statusForRole(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'katim_approved'
            : 'kabag_approved';
    }

    private function nextStatus(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'kabag_approved'
            : 'ppk_approved';
    }

    private function approvalField(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'kabag_approved_by'
            : 'ppk_approved_by';
    }

    private function approvalAtField(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'kabag_approved_at'
            : 'ppk_approved_at';
    }

    private function catatanField(): string
    {
        return auth()->user()->isPimpinanKabagUmum()
            ? 'catatan_kabag'
            : 'catatan_ppk';
    }

    private function rejectedStep(): string
    {
        return auth()->user()->isPimpinanKabagUmum() ? 'kabag' : 'ppk';
    }

    public function index(): Response
    {
        $tahun  = TahunAnggaran::forSession();
        $status = $this->statusForRole();

        $menunggu = PermohonanDana::with(['items', 'timKerja', 'createdBy'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', $status)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($pd) => array_merge($pd->toArray(), ['status_label' => $pd->status_label]));

        return Inertia::render('Pimpinan/PermohonanDana/Index', [
            'tahun'    => $tahun,
            'menunggu' => $menunggu,
            'role'     => auth()->user()->pimpinan_type,
        ]);
    }

    public function approve(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== $this->statusForRole(), 422, 'Status tidak valid.');

        $request->validate(['catatan' => 'nullable|string|max:1000']);

        $pd->update([
            'status'                  => $this->nextStatus(),
            $this->approvalField()    => $request->user()->id,
            $this->catatanField()     => $request->catatan,
            $this->approvalAtField()  => now(),
        ]);

        $next = $request->user()->isPimpinanKabagUmum() ? 'PPK' : 'PIC Keuangan';

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} disetujui, diteruskan ke {$next}.");
    }

    public function reject(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== $this->statusForRole(), 422, 'Status tidak valid.');

        $request->validate(['catatan' => 'required|string|max:1000']);

        $pd->update([
            'status'                 => 'rejected',
            $this->approvalField()   => $request->user()->id,
            $this->catatanField()    => $request->catatan,
            $this->approvalAtField() => now(),
            'rejected_at_step'       => $this->rejectedStep(),
            'catatan_penolakan'      => $request->catatan,
            'rejected_at'            => now(),
        ]);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} ditolak.");
    }
}
