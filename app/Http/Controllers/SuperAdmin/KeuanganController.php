<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use Inertia\Inertia;
use Inertia\Response;

class KeuanganController extends Controller
{
    public function permohonanDana(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $permohonan = PermohonanDana::with(['timKerja', 'items', 'createdBy'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($pd) => array_merge($pd->toArray(), ['status_label' => $pd->status_label]));

        return Inertia::render('SuperAdmin/Keuangan/PermohonanDana/Index', [
            'tahun'       => $tahun,
            'permohonan'  => $permohonan,
            'timKerjaList' => TimKerja::active()->orderBy('nama')->get(['id', 'nama']),
        ]);
    }
}
