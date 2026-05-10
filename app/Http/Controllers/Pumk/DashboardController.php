<?php

namespace App\Http\Controllers\Pumk;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $tahun = TahunAnggaran::forSession();

        $stats = PermohonanDana::where('tahun_anggaran_id', $tahun->id)
            ->where('created_by', $user->id)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN status IN ('submitted','katim_approved','kabag_approved','ppk_approved','pic_approved') THEN 1 ELSE 0 END) as proses,
                SUM(CASE WHEN status = 'dicairkan' THEN 1 ELSE 0 END) as dicairkan,
                SUM(CASE WHEN status = 'dicairkan' THEN total_anggaran ELSE 0 END) as total_dicairkan
            ")
            ->first();

        $user->load('timkerja');

        return Inertia::render('Pumk/Dashboard', [
            'tahun' => $tahun,
            'stats' => $stats,
            'userInfo' => [
                'nama' => $user->nama_lengkap,
                'nip' => $user->nip,
                'role' => $user->role_name,
                'nama_unit' => $user->timkerja?->nama,
                'kode_unit' => $user->timkerja?->kode,
            ],
        ]);
    }
}
