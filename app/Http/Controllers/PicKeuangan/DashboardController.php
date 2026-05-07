<?php

namespace App\Http\Controllers\PicKeuangan;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $stats = PermohonanDana::where('tahun_anggaran_id', $tahun->id)
            ->selectRaw("
                SUM(CASE WHEN status = 'ppk_approved' THEN 1 ELSE 0 END) as menunggu_verifikasi,
                SUM(CASE WHEN status = 'pic_approved' THEN 1 ELSE 0 END) as menunggu_pencairan,
                SUM(CASE WHEN status = 'dicairkan' THEN 1 ELSE 0 END) as selesai
            ")
            ->first();

        return Inertia::render('PicKeuangan/Dashboard', [
            'tahun' => $tahun,
            'stats' => $stats,
        ]);
    }
}
