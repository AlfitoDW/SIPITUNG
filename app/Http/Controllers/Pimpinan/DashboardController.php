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
        $user   = auth()->user();
        $type   = $user->pimpinan_type;
        $tahun  = TahunAnggaran::forSession();

        // Status mapping per jabatan
        $pendingStatus  = $type === 'kabag_umum' ? 'submitted'      : 'kabag_approved';
        $approvedStatus = $type === 'kabag_umum' ? 'kabag_approved' : 'ppk_approved';

        $pdPendingStatus  = $type === 'kabag_umum' ? 'submitted'      : 'katimku_approved';
        $pdApprovedStatus = $type === 'kabag_umum' ? 'kabag_approved' : 'ppk_approved';
        $pdRejectedBy     = $type === 'kabag_umum' ? 'kabag_umum'     : 'ppk';

        $pending = $tahun ? [
            'pk_awal'         => PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('jenis', 'awal')->where('status', $pendingStatus)->count(),
            'pk_revisi'       => PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('jenis', 'revisi')->where('status', $pendingStatus)->count(),
            'ra'              => RencanaAksi::where('tahun_anggaran_id', $tahun->id)->where('status', $pendingStatus)->count(),
            'permohonan_dana' => PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', $pdPendingStatus)->count(),
            'pengukuran'      => $type === 'kabag_umum'
                ? LaporanPengukuran::where('status', 'submitted')
                    ->whereHas('periode', fn($q) => $q->where('tahun_anggaran_id', $tahun->id))
                    ->count()
                : 0,
        ] : ['pk_awal' => 0, 'pk_revisi' => 0, 'ra' => 0, 'permohonan_dana' => 0, 'pengukuran' => 0];

        $approved = $tahun ? [
            'pk'              => PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('status', $approvedStatus)->count(),
            'ra'              => RencanaAksi::where('tahun_anggaran_id', $tahun->id)->where('status', $approvedStatus)->count(),
            'permohonan_dana' => PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', $pdApprovedStatus)->count(),
            'pengukuran'      => $type === 'kabag_umum'
                ? LaporanPengukuran::where('status', 'kabag_approved')
                    ->whereHas('periode', fn($q) => $q->where('tahun_anggaran_id', $tahun->id))
                    ->count()
                : 0,
        ] : ['pk' => 0, 'ra' => 0, 'permohonan_dana' => 0, 'pengukuran' => 0];

        $rejected = $tahun ? [
            'pk'              => PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('status', 'rejected')->where('rejected_by', $type)->count(),
            'ra'              => RencanaAksi::where('tahun_anggaran_id', $tahun->id)->where('status', 'rejected')->where('rejected_by', $type)->count(),
            'permohonan_dana' => PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', 'rejected')->where('rejected_by', $pdRejectedBy)->count(),
        ] : ['pk' => 0, 'ra' => 0, 'permohonan_dana' => 0];

        // Periode pengukuran aktif
        $periodePengukuran = $tahun ? PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->where('is_active', true)
            ->orderByRaw("FIELD(triwulan,'TW1','TW2','TW3','TW4')")
            ->get()
            ->map(fn($p) => [
                'id'       => $p->id,
                'triwulan' => $p->triwulan,
                'laporan_submitted'     => LaporanPengukuran::where('periode_pengukuran_id', $p->id)->where('status', 'submitted')->count(),
                'laporan_approved'      => LaporanPengukuran::where('periode_pengukuran_id', $p->id)->where('status', 'kabag_approved')->count(),
            ]) : collect();

        return Inertia::render('Pimpinan/Dashboard', [
            'user'              => $user,
            'pimpinanType'      => $type,
            'tahun'             => $tahun,
            'pending'           => $pending,
            'approved'          => $approved,
            'rejected'          => $rejected,
            'periodePengukuran' => $periodePengukuran,
        ]);
    }
}
