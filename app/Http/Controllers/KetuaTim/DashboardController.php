<?php

namespace App\Http\Controllers\KetuaTim;

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
        $user       = auth()->user();
        $timKerjaId = $user->tim_kerja_id;
        $tahun      = TahunAnggaran::forSession();

        // ── Perencanaan ───────────────────────────────────────────────────────────
        $pkAwal = $tahun ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)->where('jenis', 'awal')
            ->select('id', 'status')->first() : null;

        $pkRevisi = $tahun ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)->where('jenis', 'revisi')
            ->select('id', 'status')->first() : null;

        $ra = $tahun ? RencanaAksi::withCount('indikators')
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->select('id', 'status')->first() : null;

        // ── Keuangan — Permohonan Dana ─────────────────────────────────────────
        $pdCounts = $tahun ? PermohonanDana::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->selectRaw('status, count(*) as n')
            ->groupBy('status')
            ->pluck('n', 'status') : collect();

        $nilaiDicairkan = $tahun ? (float) PermohonanDana::where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->where('status', 'dicairkan')
            ->sum('total_anggaran') : 0;

        // Hanya tampil untuk ketua koordinator: antrian approval
        $approvalPending = ($tahun && $user->isKetuaKoordinator())
            ? PermohonanDana::where('tahun_anggaran_id', $tahun->id)
                ->where('status', 'bendahara_checked')->count()
            : 0;

        return Inertia::render('KetuaTim/Dashboard', [
            'user'     => $user,
            'timKerja' => $user->timkerja,
            'tahun'    => $tahun,
            'pkAwal'   => $pkAwal,
            'pkRevisi' => $pkRevisi,
            'ra'       => $ra,
            'permohonan' => [
                'draft'             => $pdCounts->get('draft', 0),
                'submitted'         => $pdCounts->get('submitted', 0),
                'kabag_approved'    => $pdCounts->get('kabag_approved', 0),
                'bendahara_checked' => $pdCounts->get('bendahara_checked', 0),
                'katimku_approved'  => $pdCounts->get('katimku_approved', 0),
                'ppk_approved'      => $pdCounts->get('ppk_approved', 0),
                'dicairkan'         => $pdCounts->get('dicairkan', 0),
                'rejected'          => $pdCounts->get('rejected', 0),
                'nilai_dicairkan'   => $nilaiDicairkan,
            ],
            'approvalPending' => $approvalPending,
        ]);
    }
}
