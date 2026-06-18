<?php

namespace App\Http\Controllers\Bendahara;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $tahun = TahunAnggaran::forSession();
        $tahunId = $tahun?->id;

        // ─── Summary Cards ─────────────────────────────────────────────────
        $siapCair = $tahunId
            ? PermohonanDana::where('tahun_anggaran_id', $tahunId)->where('status', 'ppk_approved')->count()
            : 0;
        $sudahCair = $tahunId
            ? PermohonanDana::where('tahun_anggaran_id', $tahunId)->where('status', 'dicairkan')->count()
            : 0;
        $nilaiCair = $tahunId
            ? (float) PermohonanDana::where('tahun_anggaran_id', $tahunId)->where('status', 'dicairkan')->sum('total_anggaran')
            : 0;
        $nilaiSiap = $tahunId
            ? (float) PermohonanDana::where('tahun_anggaran_id', $tahunId)->where('status', 'ppk_approved')->sum('total_anggaran')
            : 0;

        // ─── Pipeline (status breakdown) ───────────────────────────────────
        $pipeline = $tahunId
            ? [
                'ppk_approved' => PermohonanDana::where('tahun_anggaran_id', $tahunId)->where('status', 'ppk_approved')->count(),
                'pic_approved' => PermohonanDana::where('tahun_anggaran_id', $tahunId)->where('status', 'pic_approved')->count(),
                'dicairkan' => PermohonanDana::where('tahun_anggaran_id', $tahunId)->where('status', 'dicairkan')->count(),
                'rejected' => PermohonanDana::where('tahun_anggaran_id', $tahunId)->where('status', 'rejected')->count(),
            ]
            : [
                'ppk_approved' => 0,
                'pic_approved' => 0,
                'dicairkan' => 0,
                'rejected' => 0,
            ];

        // ─── Tugas Hari Ini (siap dicairkan, oldest first) ─────────────────
        $tugasHariIni = collect();
        if ($tahunId) {
            $tugasHariIni = PermohonanDana::with('timKerja')
                ->where('tahun_anggaran_id', $tahunId)
                ->where('status', 'ppk_approved')
                ->orderBy('ppk_approved_at', 'asc')
                ->limit(8)
                ->get(['id', 'nomor_permohonan', 'keperluan', 'total_anggaran', 'ppk_approved_at', 'tim_kerja_id']);
        }

        // Tambahkan computed field: hari menunggu
        $tugasHariIni = $tugasHariIni->map(function ($pd) {
            $pd->hari_menunggu = $pd->ppk_approved_at
                ? Carbon::parse($pd->ppk_approved_at)->diffInDays(now())
                : 0;

            return $pd;
        });

        // ─── Riwayat Pencairan Terakhir ───────────────────────────────────
        $riwayatCair = $tahunId
            ? PermohonanDana::with(['timKerja'])
                ->where('tahun_anggaran_id', $tahunId)
                ->where('status', 'dicairkan')
                ->orderByDesc('dicairkan_at')
                ->limit(5)
                ->get(['id', 'nomor_permohonan', 'keperluan', 'total_anggaran', 'dicairkan_at', 'tim_kerja_id'])
            : collect();

        return Inertia::render('Bendahara/Dashboard', [
            'user' => ['nama_lengkap' => $user->nama_lengkap],
            'tahun' => $tahun,
            'siapCair' => $siapCair,
            'sudahCair' => $sudahCair,
            'nilaiCair' => $nilaiCair,
            'nilaiSiap' => $nilaiSiap,
            'pipeline' => $pipeline,
            'tugasHariIni' => $tugasHariIni,
            'riwayatCair' => $riwayatCair,
        ]);
    }

    public function verifikasiLpj(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $base = $tahun ? PermohonanDana::with('timKerja')
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', 'dicairkan')
            ->orderByDesc('dicairkan_at') : null;

        $permohonan = $base ? $base->get()->map(function ($pd) {
            return [
                'id' => $pd->id,
                'nomor_permohonan' => $pd->nomor_permohonan,
                'keperluan' => $pd->keperluan,
                'total_anggaran' => $pd->total_anggaran,
                'dicairkan_at' => $pd->dicairkan_at?->toDateString(),
                'tgl_pertanggungjawaban' => $pd->tgl_pertanggungjawaban?->toDateString(),
                'tim_kerja_nama' => $pd->tim_kerja_nama,
                'lpj_uploaded_at' => $pd->lpj_uploaded_at?->toIso8601String(),
                'lpj_uploaded_by_name' => $pd->lpj_uploaded_by_name,
                'lpj_file_name' => $pd->lpj_file_name,
                'bukti_bayar_path' => $pd->bukti_bayar_path,
            ];
        }) : collect();

        return Inertia::render('Bendahara/VerifikasiLPJ', [
            'tahun' => $tahun,
            'permohonan' => $permohonan,
        ]);
    }
}
