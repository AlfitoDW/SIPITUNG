<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\LaporanPengukuran;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\PermohonanDana;
use App\Models\RencanaAksi;
use App\Models\TahunAnggaran;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $type = $user->pimpinan_type;
        $tahun = TahunAnggaran::forSession();

        // Hanya kabag_umum yang dapat melakukan persetujuan.
        // PPK tidak lagi memiliki alur approve terpisah.
        $isKabag = $type === 'kabag_umum';

        $pending = $tahun ? [
            'pk_awal' => $isKabag ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('jenis', 'awal')->where('status', 'submitted')->count() : 0,
            'pk_revisi' => $isKabag ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('jenis', 'revisi')->where('status', 'submitted')->count() : 0,
            'ra' => $isKabag ? RencanaAksi::where('tahun_anggaran_id', $tahun->id)->where('status', 'submitted')->count() : 0,
            'permohonan_dana' => $isKabag ? PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', 'submitted')->count() : 0,
            'pengukuran' => $isKabag
                ? LaporanPengukuran::where('status', 'submitted')
                    ->whereHas('periode', fn ($q) => $q->where('tahun_anggaran_id', $tahun->id))
                    ->count()
                : 0,
        ] : ['pk_awal' => 0, 'pk_revisi' => 0, 'ra' => 0, 'permohonan_dana' => 0, 'pengukuran' => 0];

        $approved = $tahun ? [
            'pk' => PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('status', 'kabag_approved')->count(),
            'ra' => RencanaAksi::where('tahun_anggaran_id', $tahun->id)->where('status', 'kabag_approved')->count(),
            'permohonan_dana' => PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', 'kabag_approved')->count(),
            'pengukuran' => LaporanPengukuran::where('status', 'kabag_approved')
                ->whereHas('periode', fn ($q) => $q->where('tahun_anggaran_id', $tahun->id))
                ->count(),
        ] : ['pk' => 0, 'ra' => 0, 'permohonan_dana' => 0, 'pengukuran' => 0];

        $rejected = $tahun ? [
            'pk' => PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('status', 'rejected')->count(),
            'ra' => RencanaAksi::where('tahun_anggaran_id', $tahun->id)->where('status', 'rejected')->count(),
            'permohonan_dana' => PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', 'rejected')->count(),
        ] : ['pk' => 0, 'ra' => 0, 'permohonan_dana' => 0];

        // Periode pengukuran yang punya laporan (tidak perlu is_active)
        $periodePengukuran = $tahun ? PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->whereHas('laporans')
            ->orderByRaw("FIELD(triwulan,'TW1','TW2','TW3','TW4')")
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'triwulan' => $p->triwulan,
                'laporan_submitted' => LaporanPengukuran::where('periode_pengukuran_id', $p->id)->where('status', 'submitted')->count(),
                'laporan_approved' => LaporanPengukuran::where('periode_pengukuran_id', $p->id)->where('status', 'kabag_approved')->count(),
            ]) : collect();

        return Inertia::render('Pimpinan/Dashboard', [
            'user' => $user,
            'pimpinanType' => $type,
            'tahun' => $tahun,
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
            'periodePengukuran' => $periodePengukuran,
        ]);
    }
}
