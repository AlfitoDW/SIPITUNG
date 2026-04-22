<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\LaporanPengukuran;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksiIndikator;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PengukuranController extends Controller
{
    public function kinerja(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user  = auth()->user();

        $periodes = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->where('is_active', true)
            ->orderByRaw("FIELD(triwulan, 'TW1','TW2','TW3','TW4')")
            ->get();

        $periodeId = $request->integer('periode_id');
        $periode   = $periodeId
            ? $periodes->firstWhere('id', $periodeId)
            : $periodes->first();

        $matrix   = [];
        $laporans = [];

        if ($periode) {
            $twKey = strtolower($periode->triwulan);

            $pks = PerjanjianKinerja::with([
                'sasarans'                         => fn ($q) => $q->orderBy('kode'),
                'sasarans.indikators'              => fn ($q) => $q->orderBy('kode'),
                'sasarans.indikators.picTimKerjas',
                'sasarans.indikators.realisasis'   => fn ($q) => $q->with('inputByTimKerja')
                    ->where('periode_pengukuran_id', $periode->id),
            ])
                ->where('tahun_anggaran_id', $tahun->id)
                ->where('jenis', 'awal')
                ->orderBy('id')
                ->get();

            // Build lookup: target TW dari Rencana Aksi (user-editable), key = "{sasaran_id}_{kode}"
            $allSasaranIds = $pks->flatMap(fn ($pk) => $pk->sasarans->pluck('id'))->unique()->values()->all();
            $raIndMap = RencanaAksiIndikator::whereIn('sasaran_id', $allSasaranIds)
                ->get()
                ->keyBy(fn ($i) => $i->sasaran_id . '_' . $i->kode);

            foreach ($pks as $pk) {
                foreach ($pk->sasarans as $sasaran) {
                    foreach ($sasaran->indikators as $iku) {
                        $r        = $iku->realisasis->first();
                        $raInd    = $raIndMap->get($iku->sasaran_id . '_' . $iku->kode);
                        $matrix[] = [
                            'sasaran_kode'           => $sasaran->kode,
                            'sasaran_nama'           => $sasaran->nama,
                            'iku_id'                 => $iku->id,
                            'iku_kode'               => $iku->kode,
                            'iku_nama'               => $iku->nama,
                            'iku_satuan'             => $iku->satuan,
                            'iku_target'             => $iku->target,
                            'iku_target_tw'          => $raInd?->{"target_{$twKey}"} ?? $iku->{"target_{$twKey}"},
                            'pic_tim_kerjas'         => $iku->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama', 'kode', 'nama_singkat'])),
                            'realisasi'              => $r?->realisasi,
                            'progress_kegiatan'      => $r?->progress_kegiatan,
                            'kendala'                => $r?->kendala,
                            'strategi_tindak_lanjut' => $r?->strategi_tindak_lanjut,
                            'catatan'                => $r?->catatan,
                            'input_by_tim_kerja'     => $r?->inputByTimKerja?->only(['id', 'nama', 'kode']),
                        ];
                    }
                }
            }

            $laporans = LaporanPengukuran::with([
                'timKerja:id,nama,kode,nama_singkat',
                'peerTimKerja:id,nama,kode,nama_singkat',
            ])
                ->where('periode_pengukuran_id', $periode->id)
                ->whereIn('status', ['submitted', 'kabag_approved', 'rejected'])
                ->get()
                ->map(fn ($l) => [
                    'id'                   => $l->id,
                    'tim_kerja_id'         => $l->tim_kerja_id,
                    'tim_kerja_nama'       => $l->timKerja?->nama ?? '',
                    'tim_kerja_kode'       => $l->timKerja?->kode ?? '',
                    'peer_tim_kerja_id'    => $l->peer_tim_kerja_id,
                    'peer_tim_kerja_nama'  => $l->peerTimKerja?->nama_singkat ?? $l->peerTimKerja?->nama,
                    'status'               => $l->status,
                    'submitted_at'         => $l->submitted_at?->format('d M Y H:i'),
                    'rekomendasi_kabag'    => $l->rekomendasi_kabag,
                    'approved_at'          => $l->approved_at?->format('d M Y H:i'),
                ]);
        }

        return Inertia::render('Pimpinan/Pengukuran/Kinerja', [
            'tahun'    => $tahun,
            'periodes' => $periodes,
            'periode'  => $periode,
            'matrix'   => $matrix,
            'laporans' => $laporans,
            'role'     => $user->pimpinan_type,
            'rekomendasi_pimpinan' => $periode?->rekomendasi_pimpinan,
        ]);
    }

    public function saveRekomendasi(Request $request): \Illuminate\Http\RedirectResponse
    {
        abort_unless(auth()->user()->pimpinan_type === 'kabag_umum', 403);

        $request->validate(['rekomendasi_pimpinan' => 'nullable|string|max:5000']);

        $tahun = TahunAnggaran::forSession();

        $periodes = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->orderByRaw("FIELD(triwulan, 'TW1','TW2','TW3','TW4')")
            ->get();

        $periodeId = $request->integer('periode_id');
        $periode   = $periodeId
            ? $periodes->firstWhere('id', $periodeId)
            : $periodes->first();

        abort_if(! $periode, 404, 'Periode tidak ditemukan.');

        $periode->update(['rekomendasi_pimpinan' => $request->rekomendasi_pimpinan]);

        return back()->with('success', 'Rekomendasi pimpinan berhasil disimpan.');
    }


    public function approve(Request $request, LaporanPengukuran $laporan): RedirectResponse
    {
        abort_unless(auth()->user()->pimpinan_type === 'kabag_umum', 403);
        abort_if($laporan->status !== 'submitted', 422, 'Laporan belum disubmit atau sudah diproses.');

        $request->validate(['rekomendasi' => 'nullable|string|max:2000']);

        $laporan->update([
            'status'            => 'kabag_approved',
            'rekomendasi_kabag' => null,   // bersihkan catatan rejection sebelumnya
            'approved_at'       => now(),
            'approved_by'       => $request->user()->id,
        ]);

        return back()->with('success', "Laporan {$laporan->timKerja->nama} berhasil disetujui.");
    }

    public function reject(Request $request, LaporanPengukuran $laporan): RedirectResponse
    {
        abort_unless(auth()->user()->pimpinan_type === 'kabag_umum', 403);
        abort_if($laporan->status !== 'submitted', 422, 'Laporan belum disubmit atau sudah diproses.');

        $request->validate(['rekomendasi' => 'nullable|string|max:2000']);

        $laporan->update([
            'status'            => 'rejected',
            'rekomendasi_kabag' => $request->rekomendasi,
        ]);

        return back()->with('success', "Laporan {$laporan->timKerja->nama} dikembalikan.");
    }

    public function exportPdf(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();

        $periodes = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->orderByRaw("FIELD(triwulan, 'TW1','TW2','TW3','TW4')")
            ->get();

        $periodeId = $request->integer('periode_id');
        $periode   = $periodeId
            ? $periodes->firstWhere('id', $periodeId)
            : $periodes->first();

        abort_if(! $periode, 404, 'Periode tidak ditemukan.');

        $twKey = strtolower($periode->triwulan);

        $pks = PerjanjianKinerja::with([
            'sasarans'                         => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators'              => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators.picTimKerjas',
            'sasarans.indikators.realisasis'   => fn ($q) => $q->with('inputByTimKerja')
                ->where('periode_pengukuran_id', $periode->id),
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->orderBy('id')
            ->get();

        $allSasaranIds2 = $pks->flatMap(fn ($pk) => $pk->sasarans->pluck('id'))->unique()->values()->all();
        $raIndMap2 = RencanaAksiIndikator::whereIn('sasaran_id', $allSasaranIds2)
            ->get()
            ->keyBy(fn ($i) => $i->sasaran_id . '_' . $i->kode);

        $matrix = [];
        foreach ($pks as $pk) {
            foreach ($pk->sasarans as $sasaran) {
                foreach ($sasaran->indikators as $iku) {
                    $r        = $iku->realisasis->first();
                    $raInd2   = $raIndMap2->get($iku->sasaran_id . '_' . $iku->kode);
                    $matrix[] = [
                        'sasaran_kode'           => $sasaran->kode,
                        'sasaran_nama'           => $sasaran->nama,
                        'iku_kode'               => $iku->kode,
                        'iku_nama'               => $iku->nama,
                        'iku_satuan'             => $iku->satuan,
                        'iku_target'             => $iku->target,
                        'iku_target_tw'          => $raInd2?->{"target_{$twKey}"} ?? $iku->{"target_{$twKey}"},
                        'pic_tim_kerjas'         => $iku->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama'])),
                        'realisasi'              => $r?->realisasi,
                        'progress_kegiatan'      => $r?->progress_kegiatan,
                        'kendala'                => $r?->kendala,
                        'strategi_tindak_lanjut' => $r?->strategi_tindak_lanjut,
                        'input_by_tim_kerja'     => $r?->inputByTimKerja?->only(['id', 'nama']),
                    ];
                }
            }
        }

        $laporans = LaporanPengukuran::with('timKerja:id,nama,kode,nama_singkat')
            ->where('periode_pengukuran_id', $periode->id)
            ->get()
            ->map(fn ($l) => [
                'tim_kerja_nama'    => $l->timKerja?->nama ?? '',
                'status'            => $l->status,
                'rekomendasi_kabag' => $l->rekomendasi_kabag,
                'approved_at'       => $l->approved_at?->format('d M Y'),
            ]);

        return Inertia::render('Pimpinan/Pengukuran/ExportPdf', [
            'tahun'                  => $tahun,
            'periode'                => $periode,
            'matrix'                 => $matrix,
            'laporans'               => $laporans,
            'rekomendasi_pimpinan'   => $periode->rekomendasi_pimpinan,
        ]);
    }
}
