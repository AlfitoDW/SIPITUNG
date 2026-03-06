<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksi;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $tahun       = TahunAnggaran::where('is_default', true)->first();
        $timKerjaTotal = TimKerja::count();

        $statuses = ['draft', 'submitted', 'kabag_approved', 'ppk_approved', 'rejected'];

        $pkAwal   = $tahun ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('jenis', 'awal')
            ->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status') : collect();

        $pkRevisi = $tahun ? PerjanjianKinerja::where('tahun_anggaran_id', $tahun->id)->where('jenis', 'revisi')
            ->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status') : collect();

        $ra       = $tahun ? RencanaAksi::where('tahun_anggaran_id', $tahun->id)
            ->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status') : collect();

        $makeStats = fn($data) => collect($statuses)->mapWithKeys(fn($s) => [$s => $data->get($s, 0)]);

        return Inertia::render('SuperAdmin/Dashboard', [
            'tahun'        => $tahun,
            'timKerjaTotal' => $timKerjaTotal,
            'pkAwal'       => $makeStats($pkAwal),
            'pkRevisi'     => $makeStats($pkRevisi),
            'ra'           => $makeStats($ra),
        ]);
    }
}
