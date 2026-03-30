<?php

namespace App\Http\Controllers\Bendahara;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user  = auth()->user();
        $tahun = TahunAnggaran::forSession();

        $verifikasi   = $tahun ? PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', 'kabag_approved')->count() : 0;
        $pencairan    = $tahun ? PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', 'ppk_approved')->count() : 0;
        $sudahCek     = $tahun ? PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', 'bendahara_checked')->count() : 0;
        $sudahCair    = $tahun ? PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', 'dicairkan')->count() : 0;
        $nilaiCair    = $tahun ? (float) PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', 'dicairkan')->sum('total_anggaran') : 0;
        $nilaiPending = $tahun ? (float) PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', 'ppk_approved')->sum('total_anggaran') : 0;

        // Riwayat 5 terakhir yang sudah dicairkan
        $riwayatCair = $tahun ? PermohonanDana::with(['timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', 'dicairkan')
            ->orderByDesc('dicairkan_at')
            ->limit(5)
            ->get(['id', 'nomor_permohonan', 'keperluan', 'total_anggaran', 'dicairkan_at', 'tim_kerja_id'])
            : collect();

        return Inertia::render('Bendahara/Dashboard', [
            'user'         => $user,
            'tahun'        => $tahun,
            'verifikasi'   => $verifikasi,
            'pencairan'    => $pencairan,
            'sudahCek'     => $sudahCek,
            'sudahCair'    => $sudahCair,
            'nilaiCair'    => $nilaiCair,
            'nilaiPending' => $nilaiPending,
            'riwayatCair'  => $riwayatCair,
        ]);
    }
}
