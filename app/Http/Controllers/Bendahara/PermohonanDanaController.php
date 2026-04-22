<?php

namespace App\Http\Controllers\Bendahara;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermohonanDanaController extends Controller
{
    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $verifikasi = PermohonanDana::with(['items', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', 'kabag_approved')
            ->orderByDesc('created_at')
            ->get();

        $pencairan = PermohonanDana::with(['items', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', 'katimku_approved')
            ->orderByDesc('created_at')
            ->get();

        $riwayat = PermohonanDana::with(['timKerja', 'items'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->whereIn('status', ['bendahara_checked', 'katimku_approved', 'dicairkan', 'rejected'])
            ->orderByDesc('updated_at')
            ->get();

        $timKerjaList = TimKerja::orderBy('nama')->get(['id', 'nama']);

        return Inertia::render('Bendahara/PermohonanDana/Index', [
            'tahun' => $tahun,
            'verifikasi' => $verifikasi,
            'pencairan' => $pencairan,
            'riwayat' => $riwayat,
            'timKerjaList' => $timKerjaList,
        ]);
    }

    public function cek(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'kabag_approved', 422, 'Hanya permohonan berstatus Disetujui Kabag yang dapat diverifikasi.');

        $request->validate(['catatan' => 'nullable|string|max:1000']);

        $pd->update([
            'status' => 'bendahara_checked',
            'bendahara_checked_by' => $request->user()->id,
            'catatan_bendahara' => $request->catatan,
        ]);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} berhasil diverifikasi.");
    }

    public function cairkan(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'katimku_approved', 422, 'Hanya permohonan berstatus Disetujui Katimku yang dapat dicairkan.');

        $request->validate(['catatan' => 'nullable|string|max:1000']);

        $pd->update([
            'status' => 'dicairkan',
            'dicairkan_by' => $request->user()->id,
            'catatan_pencairan' => $request->catatan,
            'dicairkan_at' => now(),
        ]);

        return back()->with('success', "Dana untuk permohonan {$pd->nomor_permohonan} berhasil dicairkan.");
    }
}
