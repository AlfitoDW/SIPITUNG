<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksi;
use App\Models\RencanaAksiIndikator;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerencanaanController extends Controller
{
    // views

    public function pkAwal(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user = auth()->user();

        $pks = PerjanjianKinerja::with(['sasarans.indikators.picTimKerjas', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        return Inertia::render('Pimpinan/Perencanaan/PerjanjianKinerja/Awal/Penyusunan', [
            'tahun' => $tahun,
            'pks' => $pks,
            'role' => $user->pimpinan_type,
        ]);
    }

    public function pkRevisi(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user = auth()->user();

        $pks = PerjanjianKinerja::with(['sasarans.indikators.picTimKerjas', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'revisi')
            ->get();

        return Inertia::render('Pimpinan/Perencanaan/PerjanjianKinerja/Revisi/Penyusunan', [
            'tahun' => $tahun,
            'pks' => $pks,
            'role' => $user->pimpinan_type,
        ]);
    }

    public function rencanaAksi(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user = auth()->user();

        // Gunakan SEMUA PK Awal sebagai sumber IKU (robust jika data tersebar di beberapa PK)
        $allPkAwal = PerjanjianKinerja::with([
            'sasarans' => fn ($q) => $q->orderBy('urutan'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('urutan'),
            'sasarans.indikators.picTimKerjas',
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        // Index RAI per kode IKU (dari semua RA tahun ini)
        $raiByKode = RencanaAksiIndikator::with(['rencanaAksi.timKerja', 'kegiatans'])
            ->whereHas('rencanaAksi', fn ($q) => $q->where('tahun_anggaran_id', $tahun->id))
            ->get()
            ->groupBy('kode');

        $sasaranMap = [];

        foreach ($allPkAwal as $pkAwal) {
            foreach ($pkAwal->sasarans as $sasaran) {
                if (! isset($sasaranMap[$sasaran->kode])) {
                    $sasaranMap[$sasaran->kode] = ['kode' => $sasaran->kode, 'nama' => $sasaran->nama, 'indikators' => []];
                }

                foreach ($sasaran->indikators as $iku) {
                    $rais = $raiByKode->get($iku->kode, collect());
                    $rai = $rais->firstWhere('rencanaAksi.tim_kerja_id', $iku->pic_tim_kerja_id)
                           ?? $rais->first();

                    $ra = $rai?->rencanaAksi;

                    $sasaranMap[$sasaran->kode]['indikators'][] = [
                        'id' => $rai?->id,
                        'kode' => $iku->kode,
                        'nama' => $iku->nama,
                        'satuan' => $iku->satuan,
                        'target' => $iku->target,
                        'target_tw1' => $rai?->target_tw1,
                        'target_tw2' => $rai?->target_tw2,
                        'target_tw3' => $rai?->target_tw3,
                        'target_tw4' => $rai?->target_tw4,
                        'pic_tim_kerjas' => $iku->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama', 'kode']))->values(),
                        'ra_status' => $ra?->status,
                        'ra_id' => $ra?->id,
                        'ra_tim_kerja' => $ra?->timKerja
                            ? $ra->timKerja->only(['id', 'nama', 'kode', 'nama_singkat'])
                            : null,
                        'kegiatans' => $rai ? $rai->kegiatans->map(fn ($k) => [
                            'id' => $k->id,
                            'triwulan' => $k->triwulan,
                            'urutan' => $k->urutan,
                            'nama_kegiatan' => $k->nama_kegiatan,
                        ])->values()->all() : [],
                    ];
                }
            }
        }

        // RA list untuk panel approve/reject
        $ras = RencanaAksi::with('timKerja:id,nama,kode,nama_singkat')
            ->where('tahun_anggaran_id', $tahun->id)
            ->orderBy('id')
            ->get()
            ->map(fn ($ra) => [
                'id' => $ra->id,
                'status' => $ra->status,
                'rekomendasi_kabag' => $ra->rekomendasi_kabag,
                'tim_kerja' => $ra->timKerja
                    ? $ra->timKerja->only(['id', 'nama', 'kode', 'nama_singkat'])
                    : null,
            ])->values()->all();

        // Buang sasaran orphan (tanpa indikator)
        $sasaranMap = array_filter($sasaranMap, fn ($s) => count($s['indikators']) > 0);
        ksort($sasaranMap);

        return Inertia::render('Pimpinan/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun' => $tahun,
            'sasarans' => array_values($sasaranMap),
            'ras' => $ras,
            'role' => $user->pimpinan_type,
        ]);
    }

    // PK Actions
    public function pkApprove(Request $request, PerjanjianKinerja $pk): RedirectResponse
    {
        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        abort_if($pk->status !== 'submitted', 422, 'Status tidak valid.');

        $pk->update([
            'status' => 'kabag_approved',
            'rekomendasi_kabag' => null,   // bersihkan catatan rejection sebelumnya
        ]);

        return back()->with('success', "PK {$pk->timKerja->nama_singkat} berhasil disetujui.");
    }

    public function pkReject(Request $request, PerjanjianKinerja $pk): RedirectResponse
    {
        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        abort_if($pk->status !== 'submitted', 422, 'Status tidak valid.');

        $pk->update([
            'status' => 'rejected',
            'rejected_by' => 'kabag_umum',
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
            'status' => 'kabag_approved',
            'rekomendasi_kabag' => null,   // bersihkan catatan rejection sebelumnya
        ]);

        return back()->with('success', "RA {$ra->timKerja->nama_singkat} berhasil disetujui.");
    }

    public function raReject(Request $request, RencanaAksi $ra): RedirectResponse
    {
        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        abort_if($ra->status !== 'submitted', 422, 'Status tidak valid.');

        $ra->update([
            'status' => 'rejected',
            'rejected_by' => 'kabag_umum',
            'rekomendasi_kabag' => $request->rekomendasi,
        ]);

        return back()->with('success', "RA {$ra->timKerja->nama_singkat} ditolak.");
    }
}
