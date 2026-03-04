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

        $ras = RencanaAksi::with(['indikators', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->get();

        return Inertia::render('SuperAdmin/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun' => $tahun,
            'ras'   => $ras,
        ]);
    }

    // ─── PK Approve / Reject / Reopen ───────────────────────────────────────────

    public function pkApprove(PerjanjianKinerja $pk): RedirectResponse
    {
        abort_if($pk->status !== 'submitted', 422, 'Hanya dokumen submitted yang dapat disetujui.');
        $pk->update(['status' => 'approved']);

        return back()->with('success', "PK {$pk->timKerja->nama_singkat} berhasil disetujui.");
    }

    public function pkReject(PerjanjianKinerja $pk): RedirectResponse
    {
        abort_if($pk->status !== 'submitted', 422, 'Hanya dokumen submitted yang dapat ditolak.');
        $pk->update(['status' => 'rejected']);

        return back()->with('success', "PK {$pk->timKerja->nama_singkat} ditolak.");
    }

    public function pkReopen(PerjanjianKinerja $pk): RedirectResponse
    {
        abort_if($pk->status !== 'approved', 422, 'Hanya dokumen approved yang dapat dibuka kembali.');
        $pk->update(['status' => 'draft']);

        return back()->with('success', "PK {$pk->timKerja->nama_singkat} dibuka kembali.");
    }

    // ─── RA Approve / Reject / Reopen ───────────────────────────────────────────

    public function raApprove(RencanaAksi $ra): RedirectResponse
    {
        abort_if($ra->status !== 'submitted', 422, 'Hanya dokumen submitted yang dapat disetujui.');
        $ra->update(['status' => 'approved']);

        return back()->with('success', "RA {$ra->timKerja->nama_singkat} berhasil disetujui.");
    }

    public function raReject(RencanaAksi $ra): RedirectResponse
    {
        abort_if($ra->status !== 'submitted', 422, 'Hanya dokumen submitted yang dapat ditolak.');
        $ra->update(['status' => 'rejected']);

        return back()->with('success', "RA {$ra->timKerja->nama_singkat} ditolak.");
    }

    public function raReopen(RencanaAksi $ra): RedirectResponse
    {
        abort_if($ra->status !== 'approved', 422, 'Hanya dokumen approved yang dapat dibuka kembali.');
        $ra->update(['status' => 'draft']);

        return back()->with('success', "RA {$ra->timKerja->nama_singkat} dibuka kembali.");
    }
}
