<?php

namespace App\Http\Controllers\PicKeuangan;

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

        // ─── Summary stats ───────────────────────────────────────────────
        $baseQuery = $tahunId ? PermohonanDana::where('tahun_anggaran_id', $tahunId) : PermohonanDana::whereRaw('1 = 0');

        $stats = $baseQuery->clone()->selectRaw("
            SUM(CASE WHEN status = 'katim_approved' THEN 1 ELSE 0 END) as menunggu_verifikasi,
            SUM(CASE WHEN status = 'pic_approved' THEN 1 ELSE 0 END) as menunggu_pencairan,
            SUM(CASE WHEN status = 'dicairkan' THEN 1 ELSE 0 END) as selesai
        ")->first();

        $nilaiVerifikasi = $baseQuery->clone()->where('status', 'katim_approved')->sum('total_anggaran');
        $nilaiPencairan = $baseQuery->clone()->where('status', 'pic_approved')->sum('total_anggaran');
        $nilaiSelesai = $baseQuery->clone()->where('status', 'dicairkan')->sum('total_anggaran');

        // ─── Pipeline ────────────────────────────────────────────────────
        $pipeline = $tahunId
            ? [
                'katim_approved' => (int) $baseQuery->clone()->where('status', 'katim_approved')->count(),
                'pic_approved' => (int) $baseQuery->clone()->where('status', 'pic_approved')->count(),
                'dicairkan' => (int) $baseQuery->clone()->where('status', 'dicairkan')->count(),
            ]
            : ['katim_approved' => 0, 'pic_approved' => 0, 'dicairkan' => 0];

        // ─── Tugas: katim_approved yang menunggu verifikasi PIC ──────────────
        $tugasHariIni = collect();
        if ($tahunId) {
            $tugasHariIni = PermohonanDana::with('timKerja')
                ->where('tahun_anggaran_id', $tahunId)
                ->where('status', 'katim_approved')
                ->orderBy('katim_approved_at', 'asc')
                ->limit(8)
                ->get(['id', 'nomor_permohonan', 'keperluan', 'total_anggaran', 'katim_approved_at', 'tim_kerja_id']);
        }

        $tugasHariIni = $tugasHariIni->map(function ($pd) {
            $pd->hari_menunggu = $pd->katim_approved_at ? Carbon::parse($pd->katim_approved_at)->diffInDays(now()) : 0;

            return $pd;
        });

        // ─── Riwayat Verifikasi (pic_approved atau dicairkan terakhir) ─────
        $riwayatVerifikasi = collect();
        if ($tahunId) {
            $riwayatVerifikasi = PermohonanDana::with('timKerja')
                ->where('tahun_anggaran_id', $tahunId)
                ->whereIn('status', ['pic_approved', 'dicairkan'])
                ->whereNotNull('pic_approved_by')
                ->orderByDesc('pic_approved_at')
                ->limit(5)
                ->get(['id', 'nomor_permohonan', 'keperluan', 'total_anggaran', 'status', 'pic_approved_at', 'tim_kerja_id']);
        }

        return Inertia::render('PicKeuangan/Dashboard', [
            'tahun' => $tahun,
            'user' => ['nama_lengkap' => $user->nama_lengkap],
            'stats' => $stats,
            'pipeline' => $pipeline,
            'tugasHariIni' => $tugasHariIni,
            'riwayatVerifikasi' => $riwayatVerifikasi,
            'nilaiVerifikasi' => (float) $nilaiVerifikasi,
            'nilaiPencairan' => (float) $nilaiPencairan,
            'nilaiSelesai' => (float) $nilaiSelesai,
        ]);
    }

    public function verifikasiLpj(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $userId = auth()->id();

        $base = $tahun ? PermohonanDana::with('timKerja')
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('pic_keuangan_id', $userId)
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

        return Inertia::render('PicKeuangan/VerifikasiLPJ', [
            'tahun' => $tahun,
            'permohonan' => $permohonan,
        ]);
    }
}
