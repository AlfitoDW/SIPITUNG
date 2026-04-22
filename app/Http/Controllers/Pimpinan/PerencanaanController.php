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

        // Prioritas status: kabag_approved=4 > submitted=3 > rejected=2 > draft=1
        $statusPriority = ['kabag_approved' => 4, 'submitted' => 3, 'rejected' => 2, 'draft' => 1];

        $sasaranMap = [];

        foreach ($allPkAwal as $pkAwal) {
            foreach ($pkAwal->sasarans as $sasaran) {
                if (! isset($sasaranMap[$sasaran->kode])) {
                    $sasaranMap[$sasaran->kode] = ['kode' => $sasaran->kode, 'nama' => $sasaran->nama, 'indikators' => []];
                }

                foreach ($sasaran->indikators as $iku) {
                    $rais = $raiByKode->get($iku->kode, collect());
                    $picIds = $iku->picTimKerjas->pluck('id')->toArray();

                    if (! empty($picIds)) {
                        // Ambil semua RAI yang tim-nya adalah salah satu PIC IKU ini,
                        // lalu pilih yang statusnya paling maju
                        $matchingRais = $rais->filter(
                            fn ($r) => in_array($r->rencanaAksi?->tim_kerja_id, $picIds)
                        );
                        $rai = $matchingRais->sortByDesc(
                            fn ($r) => $statusPriority[$r->rencanaAksi?->status ?? 'draft'] ?? 0
                        )->first();
                    } else {
                        // IKU tanpa PIC: fallback ke RAI pertama
                        $rai = $rais->first();
                    }

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

        // ─── Bangun panel Status RA per Tim Kerja ───────────────────────────────
        // Untuk kolaborasi: tampilkan status gabungan per pasangan
        $allRas = RencanaAksi::with(['timKerja:id,nama,kode,nama_singkat', 'peerTimKerja:id,nama,kode,nama_singkat'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->orderBy('id')
            ->get();

        $rasMandiri     = [];
        $raDisplayMap   = []; // key simetris untuk dedup pasangan kolaborasi

        foreach ($allRas as $ra) {
            if ($ra->peer_tim_kerja_id === null) {
                $rasMandiri[] = [
                    'id'               => $ra->id,
                    'status'           => $ra->status,
                    'rekomendasi_kabag'=> $ra->rekomendasi_kabag,
                    'tim_kerja'        => $ra->timKerja?->only(['id', 'nama', 'kode', 'nama_singkat']),
                    'peer_tim_kerja'   => null,
                    'is_kolaborasi'    => false,
                ];
            } else {
                $a = min($ra->tim_kerja_id, $ra->peer_tim_kerja_id);
                $b = max($ra->tim_kerja_id, $ra->peer_tim_kerja_id);
                $pairKey = "{$a}|{$b}";
                if (! isset($raDisplayMap[$pairKey])) {
                    $raDisplayMap[$pairKey] = ['ra' => $ra, 'mirror' => null];
                } else {
                    $raDisplayMap[$pairKey]['mirror'] = $ra;
                }
            }
        }

        // Status gabungan kolaborasi: submitted > rejected > draft > kabag_approved
        // (submitted paling utama — butuh perhatian Kabag)
        $kolabPriority = ['submitted' => 4, 'rejected' => 3, 'draft' => 2, 'kabag_approved' => 1];
        $rasKolaborasi  = [];

        foreach ($raDisplayMap as $pair) {
            $ra     = $pair['ra'];
            $mirror = $pair['mirror'];

            $raStatus     = $ra->status;
            $mirrorStatus = $mirror?->status ?? $ra->status;

            $displayStatus = ($kolabPriority[$raStatus] ?? 0) >= ($kolabPriority[$mirrorStatus] ?? 0)
                ? $raStatus
                : $mirrorStatus;

            // Ambil catatan dari RA yang statusnya match displayStatus (atau gabungkan)
            $note = null;
            if ($displayStatus === $raStatus) {
                $note = $ra->rekomendasi_kabag;
            } elseif ($mirror) {
                $note = $mirror->rekomendasi_kabag;
            }

            // Tim utama (RA milik tim pertama secara ID) dan peer
            $timRa   = ($ra->tim_kerja_id < ($mirror?->tim_kerja_id ?? PHP_INT_MAX)) ? $ra : $mirror;
            $peerRa  = ($ra->tim_kerja_id < ($mirror?->tim_kerja_id ?? PHP_INT_MAX)) ? $mirror : $ra;

            $rasKolaborasi[] = [
                'id'               => ($timRa ?? $ra)->id,
                'status'           => $displayStatus,
                'rekomendasi_kabag'=> $note,
                'tim_kerja'        => $ra->timKerja?->only(['id', 'nama', 'kode', 'nama_singkat']),
                'peer_tim_kerja'   => $mirror?->peerTimKerja?->only(['id', 'nama', 'kode', 'nama_singkat'])
                                   ?? $ra->peerTimKerja?->only(['id', 'nama', 'kode', 'nama_singkat']),
                'is_kolaborasi'    => true,
            ];
        }

        // Gabungkan dan urutkan: submitted → rejected → kabag_approved → draft
        $sortOrder = ['submitted' => 0, 'rejected' => 1, 'kabag_approved' => 2, 'draft' => 3];
        $ras = collect(array_merge($rasMandiri, $rasKolaborasi))
            ->sortBy(fn ($r) => $sortOrder[$r['status']] ?? 9)
            ->values()
            ->all();

        // Buang sasaran orphan (tanpa indikator)
        $sasaranMap = array_filter($sasaranMap, fn ($s) => count($s['indikators']) > 0);
        ksort($sasaranMap);

        return Inertia::render('Pimpinan/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun'   => $tahun,
            'sasarans'=> array_values($sasaranMap),
            'ras'     => $ras,
            'role'    => $user->pimpinan_type,
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
            'status'           => 'kabag_approved',
            'rekomendasi_kabag'=> null,
        ]);

        // Jika RA kolaborasi, sync mirror RA pasangannya
        if ($ra->peer_tim_kerja_id) {
            $mirrorRa = RencanaAksi::where('tahun_anggaran_id', $ra->tahun_anggaran_id)
                ->where('tim_kerja_id', $ra->peer_tim_kerja_id)
                ->where('peer_tim_kerja_id', $ra->tim_kerja_id)
                ->first();
            if ($mirrorRa) {
                $mirrorRa->update([
                    'status'           => 'kabag_approved',
                    'rekomendasi_kabag'=> null,
                ]);
            }
        }

        return back()->with('success', "RA {$ra->timKerja->nama_singkat} berhasil disetujui.");
    }

    public function raReject(Request $request, RencanaAksi $ra): RedirectResponse
    {
        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        abort_if($ra->status !== 'submitted', 422, 'Status tidak valid.');

        $ra->update([
            'status'           => 'rejected',
            'rejected_by'      => 'kabag_umum',
            'rekomendasi_kabag'=> $request->rekomendasi,
        ]);

        // Jika RA kolaborasi, sync mirror RA pasangannya
        if ($ra->peer_tim_kerja_id) {
            $mirrorRa = RencanaAksi::where('tahun_anggaran_id', $ra->tahun_anggaran_id)
                ->where('tim_kerja_id', $ra->peer_tim_kerja_id)
                ->where('peer_tim_kerja_id', $ra->tim_kerja_id)
                ->first();
            if ($mirrorRa) {
                $mirrorRa->update([
                    'status'           => 'rejected',
                    'rejected_by'      => 'kabag_umum',
                    'rekomendasi_kabag'=> $request->rekomendasi,
                ]);
            }
        }

        return back()->with('success', "RA {$ra->timKerja->nama_singkat} ditolak.");
    }
}
