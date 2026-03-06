<?php

namespace App\Http\Controllers\KetuaTim;

use App\Http\Controllers\Controller;
use App\Models\PerjanjianKinerja;
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
        $tahun      = TahunAnggaran::where('is_default', true)->first();

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

        return Inertia::render('KetuaTim/Dashboard', [
            'user'     => $user,
            'timKerja' => $user->timkerja,
            'tahun'    => $tahun,
            'pkAwal'   => $pkAwal,
            'pkRevisi' => $pkRevisi,
            'ra'       => $ra,
        ]);
    }
}
