<?php

namespace App\Http\Controllers\Pumk;

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
        $baseQuery = $tahunId
            ? PermohonanDana::where('tahun_anggaran_id', $tahunId)->where('created_by', $user->id)
            : PermohonanDana::whereRaw('1 = 0');

        $stats = $baseQuery->clone()->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN status IN ('submitted','katim_approved','kabag_approved','ppk_approved','pic_approved') THEN 1 ELSE 0 END) as proses,
            SUM(CASE WHEN status = 'dicairkan' THEN 1 ELSE 0 END) as dicairkan,
            SUM(CASE WHEN status = 'dicairkan' THEN total_anggaran ELSE 0 END) as total_dicairkan
        ")->first();

        $nilaiDraft = $baseQuery->clone()->where('status', 'draft')->sum('total_anggaran');
        $nilaiProses = $baseQuery->clone()->whereIn('status', ['submitted','katim_approved','kabag_approved','ppk_approved','pic_approved'])->sum('total_anggaran');
        $nilaiRejected = $baseQuery->clone()->where('status', 'rejected')->sum('total_anggaran');

        // ─── Pipeline ────────────────────────────────────────────────────
        $pipeline = $tahunId
            ? [
                'draft'           => (int) $baseQuery->clone()->where('status', 'draft')->count(),
                'submitted'       => (int) $baseQuery->clone()->where('status', 'submitted')->count(),
                'katim_approved'  => (int) $baseQuery->clone()->where('status', 'katim_approved')->count(),
                'kabag_approved'  => (int) $baseQuery->clone()->where('status', 'kabag_approved')->count(),
                'ppk_approved'    => (int) $baseQuery->clone()->where('status', 'ppk_approved')->count(),
                'pic_approved'    => (int) $baseQuery->clone()->where('status', 'pic_approved')->count(),
                'dicairkan'       => (int) $baseQuery->clone()->where('status', 'dicairkan')->count(),
                'rejected'        => (int) $baseQuery->clone()->where('status', 'rejected')->count(),
            ]
            : array_fill_keys(['draft','submitted','katim_approved','kabag_approved','ppk_approved','pic_approved','dicairkan','rejected'], 0);

        // ─── Tugas: draft + rejected yang perlu perhatian ────────────────
        $tugasHariIni = collect();
        if ($tahunId) {
            $tugasHariIni = PermohonanDana::with('timKerja')
                ->where('tahun_anggaran_id', $tahunId)
                ->where('created_by', $user->id)
                ->whereIn('status', ['draft', 'rejected'])
                ->orderBy('updated_at', 'asc')
                ->limit(8)
                ->get(['id', 'nomor_permohonan', 'keperluan', 'total_anggaran', 'status', 'updated_at', 'rejected_at', 'tim_kerja_id']);
        }

        $tugasHariIni = $tugasHariIni->map(function ($pd) {
            $pd->hari_menunggu = $pd->updated_at ? Carbon::parse($pd->updated_at)->diffInDays(now()) : 0;
            $pd->rejected_step = $pd->rejected_at_step ?? null;
            return $pd;
        });

        // ─── Riwayat Dicairkan ───────────────────────────────────────────
        $riwayatCair = collect();
        if ($tahunId) {
            $riwayatCair = PermohonanDana::with('timKerja')
                ->where('tahun_anggaran_id', $tahunId)
                ->where('created_by', $user->id)
                ->where('status', 'dicairkan')
                ->orderByDesc('dicairkan_at')
                ->limit(5)
                ->get(['id', 'nomor_permohonan', 'keperluan', 'total_anggaran', 'dicairkan_at', 'tim_kerja_id']);
        }

        $user->load('timkerja');

        return Inertia::render('Pumk/Dashboard', [
            'tahun'        => $tahun,
            'stats'        => $stats,
            'pipeline'     => $pipeline,
            'tugasHariIni' => $tugasHariIni,
            'riwayatCair'  => $riwayatCair,
            'nilaiDraft'   => (float) $nilaiDraft,
            'nilaiProses'  => (float) $nilaiProses,
            'nilaiRejected'=> (float) $nilaiRejected,
            'userInfo'     => [
                'nama'       => $user->nama_lengkap,
                'nip'        => $user->nip,
                'role'       => $user->role_name,
                'nama_unit'  => $user->timkerja?->nama,
                'kode_unit'  => $user->timkerja?->kode,
            ],
        ]);
    }
}
