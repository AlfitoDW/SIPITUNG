<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\LaporanPengukuran;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\PermohonanDana;
use App\Models\RencanaAksi;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjaTotal = TimKerja::count();

        $makeStats = fn ($data, array $statuses) => collect($statuses)->mapWithKeys(fn ($s) => [$s => $data->get($s, 0)]);

        // ── Perencanaan ───────────────────────────────────────────────────────────
        $perencanaanStatuses = ['draft', 'submitted', 'kabag_approved', 'rejected'];

        $pkAwal = $tahun ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('jenis', 'awal')
            ->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status') : collect();

        $pkRevisi = $tahun ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('jenis', 'revisi')
            ->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status') : collect();

        $ra = $tahun ? RencanaAksi::where('tahun_anggaran_id', $tahun->id)
            ->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status') : collect();

        // ── Pengukuran Kinerja ────────────────────────────────────────────────────
        $pengukuranStatuses = ['draft', 'submitted', 'kabag_approved', 'rejected'];
        $periodeIds = $tahun
            ? PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)->pluck('id')
            : collect();
        $laporanStats = $periodeIds->count()
            ? LaporanPengukuran::whereIn('periode_pengukuran_id', $periodeIds)
                ->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status')
            : collect();

        // ── Keuangan — Permohonan Dana ─────────────────────────────────────────
        $pdStatuses = ['draft', 'submitted', 'kabag_approved', 'bendahara_checked', 'katimku_approved', 'dicairkan', 'rejected'];

        $pd = $tahun ? PermohonanDana::where('tahun_anggaran_id', $tahun->id)
            ->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status') : collect();

        $nilaiCair = $tahun ? (float) PermohonanDana::where('tahun_anggaran_id', $tahun->id)
            ->where('status', 'dicairkan')->sum('total_anggaran') : 0;

        return Inertia::render('SuperAdmin/Dashboard', [
            'tahun' => $tahun,
            'timKerjaTotal' => $timKerjaTotal,
            'pkAwal' => $makeStats($pkAwal, $perencanaanStatuses),
            'pkRevisi' => $makeStats($pkRevisi, $perencanaanStatuses),
            'ra' => $makeStats($ra, $perencanaanStatuses),
            'pengukuran' => $makeStats($laporanStats, $pengukuranStatuses),
            'permohonanDana' => $makeStats($pd, $pdStatuses),
            'nilaiCair' => $nilaiCair,
        ]);
    }
}
