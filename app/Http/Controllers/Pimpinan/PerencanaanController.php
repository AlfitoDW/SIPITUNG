<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Models\IndikatorKinerja;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksi;
use App\Models\RencanaAksiIndikator;
use App\Models\TahunAnggaran;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PerencanaanController extends Controller
{
    // views

    public function pkAwal(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user  = auth()->user();

        $pks = PerjanjianKinerja::with(['sasarans.indikators.picTimKerjas', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        return Inertia::render('Pimpinan/Perencanaan/PerjanjianKinerja/Awal/Penyusunan', [
            'tahun' => $tahun,
            'pks'   => $pks,
            'role'  => $user->pimpinan_type,
        ]);
    }

    public function pkRevisi(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user  = auth()->user();

        $pks = PerjanjianKinerja::with(['sasarans.indikators.picTimKerjas', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'revisi')
            ->get();

        return Inertia::render('Pimpinan/Perencanaan/PerjanjianKinerja/Revisi/Penyusunan', [
            'tahun' => $tahun,
            'pks'   => $pks,
            'role'  => $user->pimpinan_type,
        ]);
    }

    public function rencanaAksi(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user  = auth()->user();

        // Build PIC lookup: [sasaran_id][kode] → picTimKerjas
        $ikuPics = IndikatorKinerja::with('picTimKerjas')
            ->whereHas('sasaran.perjanjianKinerja', fn ($q) => $q
                ->where('tahun_anggaran_id', $tahun->id)
                ->where('jenis', 'awal')
            )
            ->get()
            ->groupBy('sasaran_id')
            ->map(fn ($ikus) => $ikus->keyBy('kode'));

        // Hanya ambil RA yang punya indikator sendiri (primary PIC) atau yang submitted
        // RA co-PIC (KK) yang kosong tidak perlu ditampilkan terpisah — mereka hanya blocker
        $ras = RencanaAksi::with(['indikators.sasaran', 'timKerja', 'peerTimKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->whereHas('indikators')  // hanya RA yang punya indikator (primary PIC)
            ->orWhere(function ($q) use ($tahun) {
                // Atau RA yang sudah di-submit meski kosong (edge case)
                $q->where('tahun_anggaran_id', $tahun->id)
                  ->whereIn('status', ['submitted', 'kabag_approved', 'rejected']);
            })
            ->get()
            // Deduplicate — pastikan tidak ada duplikat RA berdasarkan ID
            ->unique('id')
            ->map(function ($ra) use ($ikuPics, $tahun) {
                $grouped = $ra->indikators->groupBy('sasaran_id');

                $sasarans = $grouped->map(function ($indikators) use ($ikuPics) {
                    $s         = $indikators->first()->sasaran;
                    $sasaranId = $indikators->first()->sasaran_id;
                    $ikusMap   = $ikuPics->get($sasaranId, collect());

                    return [
                        'kode'       => $s?->kode ?? '-',
                        'nama'       => $s?->nama ?? 'Tanpa Sasaran',
                        'indikators' => $indikators->map(function ($iku) use ($ikusMap) {
                            $pkIku = $ikusMap->get($iku->kode);
                            $arr   = $iku->toArray();
                            $arr['pic_tim_kerjas'] = $pkIku
                                ? $pkIku->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama', 'kode']))->values()->toArray()
                                : [];
                            return $arr;
                        })->values()->toArray(),
                    ];
                })->values();

                return [
                    'id'               => $ra->id,
                    'status'           => $ra->status,
                    'rekomendasi_kabag'=> $ra->rekomendasi_kabag,
                    'tim_kerja'        => $ra->timKerja,
                    'peer_tim_kerja'   => $ra->peerTimKerja
                        ? $ra->peerTimKerja->only(['id', 'nama', 'kode', 'nama_singkat'])
                        : null,
                    'sasarans'         => $sasarans,
                ];
            })
            ->values();

        return Inertia::render('Pimpinan/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun' => $tahun,
            'ras'   => $ras,
            'role'  => $user->pimpinan_type,
        ]);
    }


    //PK Actions
    public function pkApprove(Request $request, PerjanjianKinerja $pk): RedirectResponse
    {
        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        abort_if($pk->status !== 'submitted', 422, 'Status tidak valid.');

        $pk->update([
            'status'            => 'kabag_approved',
            'rekomendasi_kabag' => null,   // bersihkan catatan rejection sebelumnya
        ]);

        return back()->with('success', "PK {$pk->timKerja->nama_singkat} berhasil disetujui.");
    }

    public function pkReject(Request $request, PerjanjianKinerja $pk): RedirectResponse
    {
        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        abort_if($pk->status !== 'submitted', 422, 'Status tidak valid.');

        $pk->update([
            'status'            => 'rejected',
            'rejected_by'       => 'kabag_umum',
            'rekomendasi_kabag' => $request->rekomendasi,
        ]);

        return back()->with('success', "PK {$pk->timKerja->nama_singkat} ditolak.");
    }

    // RA Actions
    public function raApprove(Request $request, RencanaAksi $ra): RedirectResponse
    {
        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        abort_if($ra->status !== 'submitted', 422, 'Status tidak valid.');

        $ra->update([
            'status'            => 'kabag_approved',
            'rekomendasi_kabag' => null,   // bersihkan catatan rejection sebelumnya
        ]);

        return back()->with('success', "RA {$ra->timKerja->nama_singkat} berhasil disetujui.");
    }

    public function raReject(Request $request, RencanaAksi $ra): RedirectResponse
    {
        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        abort_if($ra->status !== 'submitted', 422, 'Status tidak valid.');

        $ra->update([
            'status'            => 'rejected',
            'rejected_by'       => 'kabag_umum',
            'rekomendasi_kabag' => $request->rekomendasi,
        ]);

        return back()->with('success', "RA {$ra->timKerja->nama_singkat} ditolak.");
    }
}
