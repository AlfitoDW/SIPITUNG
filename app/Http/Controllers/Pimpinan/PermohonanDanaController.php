<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermohonanDanaController extends Controller
{
    private function statusForRole(): string
    {
        return 'submitted';
    }

    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $status = $this->statusForRole();

        $permohonan = PermohonanDana::with(['items', 'timKerja', 'createdBy'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', $status)
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Pimpinan/PermohonanDana/Index', [
            'tahun' => $tahun,
            'permohonan' => $permohonan,
            'role' => auth()->user()->pimpinan_type,
        ]);
    }

    public function approve(Request $request, PermohonanDana $pd): RedirectResponse
    {
        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        abort_if($pd->status !== 'submitted', 422, 'Status tidak valid.');

        $pd->update([
            'status' => 'kabag_approved',
            'kabag_approved_by' => auth()->id(),
            'rekomendasi_kabag' => $request->rekomendasi,
        ]);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} berhasil disetujui.");
    }

    public function reject(Request $request, PermohonanDana $pd): RedirectResponse
    {
        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        abort_if($pd->status !== 'submitted', 422, 'Status tidak valid.');

        $pd->update([
            'status' => 'rejected',
            'rejected_by' => 'kabag_umum',
            'rekomendasi_kabag' => $request->rekomendasi,
        ]);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} ditolak.");
    }
}
