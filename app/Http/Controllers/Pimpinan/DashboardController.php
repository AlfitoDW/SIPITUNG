<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
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

        // Permohonan dana status mapping
        $pdPendingStatus  = $type === 'kabag_umum' ? 'submitted'       : 'katimku_approved';
        $pdApprovedStatus = $type === 'kabag_umum' ? 'kabag_approved'  : 'ppk_approved';
        $pdRejectedBy     = $type === 'kabag_umum' ? 'kabag_umum'      : 'ppk';

        $pending = $tahun ? [
            'pk_awal'         => PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('jenis', 'awal')->where('status', $pendingStatus)->count(),
            'pk_revisi'       => PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('jenis', 'revisi')->where('status', $pendingStatus)->count(),
            'ra'              => RencanaAksi::where('tahun_anggaran_id', $tahun->id)->where('status', $pendingStatus)->count(),
            'permohonan_dana' => PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', $pdPendingStatus)->count(),
        ] : ['pk_awal' => 0, 'pk_revisi' => 0, 'ra' => 0, 'permohonan_dana' => 0];

        $approved = $tahun ? [
            'pk'              => PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('status', $approvedStatus)->count(),
            'ra'              => RencanaAksi::where('tahun_anggaran_id', $tahun->id)->where('status', $approvedStatus)->count(),
            'permohonan_dana' => PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', $pdApprovedStatus)->count(),
        ] : ['pk' => 0, 'ra' => 0, 'permohonan_dana' => 0];

        $rejected = $tahun ? [
            'pk'              => PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('status', 'rejected')->where('rejected_by', $type)->count(),
            'ra'              => RencanaAksi::where('tahun_anggaran_id', $tahun->id)->where('status', 'rejected')->where('rejected_by', $type)->count(),
            'permohonan_dana' => PermohonanDana::where('tahun_anggaran_id', $tahun->id)->where('status', 'rejected')->where('rejected_by', $pdRejectedBy)->count(),
        ] : ['pk' => 0, 'ra' => 0, 'permohonan_dana' => 0];

        return Inertia::render('Pimpinan/Dashboard', [
            'user'         => $user,
            'pimpinanType' => $type,
            'tahun'        => $tahun,
            'pending'      => $pending,
            'approved'     => $approved,
            'rejected'     => $rejected,
        ]);
    }
}
