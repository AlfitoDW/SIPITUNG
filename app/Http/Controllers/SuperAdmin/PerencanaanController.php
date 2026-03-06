<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksi;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PerencanaanController extends Controller
{
    public function pkAwal(): Response
    {
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();

        $pks = PerjanjianKinerja::with(['sasarans.indikators', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        return Inertia::render('SuperAdmin/Perencanaan/PerjanjianKinerja/Awal/Penyusunan', [
            'tahun' => $tahun,
            'pks'   => $pks,
        ]);
    }

    public function pkRevisi(): Response
    {
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();

        $pks = PerjanjianKinerja::with(['sasarans.indikators', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'revisi')
            ->get();

        return Inertia::render('SuperAdmin/Perencanaan/PerjanjianKinerja/Revisi/Penyusunan', [
            'tahun' => $tahun,
            'pks'   => $pks,
        ]);
    }

    public function rencanaAksi(): Response
    {
        $tahun = TahunAnggaran::where('is_default', true)->firstOrFail();

        $ras = RencanaAksi::with(['indikators.sasaran', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->get()
            ->map(function ($ra) {
                $grouped = $ra->indikators->groupBy('sasaran_id');

                $sasarans = $grouped->map(function ($indikators, $sasaranId) {
                    $s = $indikators->first()->sasaran;
                    return [
                        'kode'       => $s?->kode ?? '-',
                        'nama'       => $s?->nama ?? 'Tanpa Sasaran',
                        'indikators' => $indikators->toArray(),
                    ];
                })->values();

                return [
                    'id'       => $ra->id,
                    'status'   => $ra->status,
                    'tim_kerja' => $ra->timKerja,
                    'sasarans' => $sasarans,
                ];
            });

        return Inertia::render('SuperAdmin/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun' => $tahun,
            'ras'   => $ras,
        ]);
    }

    // ─── PK Reopen (SuperAdmin only — unlock after ppk_approved) ─────────────────

    public function pkReopen(PerjanjianKinerja $pk): RedirectResponse
    {
        abort_if($pk->status !== 'ppk_approved', 422, 'Hanya dokumen yang sudah terkunci dapat dibuka kembali.');
        $pk->update(['status' => 'draft']);

        return back()->with('success', "PK {$pk->timKerja->nama_singkat} dibuka kembali.");
    }

    // ─── RA Reopen (SuperAdmin only — unlock after ppk_approved) ─────────────────

    public function raReopen(RencanaAksi $ra): RedirectResponse
    {
        abort_if($ra->status !== 'ppk_approved', 422, 'Hanya dokumen yang sudah terkunci dapat dibuka kembali.');
        $ra->update(['status' => 'draft']);

        return back()->with('success', "RA {$ra->timKerja->nama_singkat} dibuka kembali.");
    }
}
