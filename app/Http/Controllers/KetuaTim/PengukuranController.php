<?php

namespace App\Http\Controllers\KetuaTim;

use App\Http\Controllers\Controller;
use App\Models\IndikatorKinerja;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\RealisasiKinerja;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PengukuranController extends Controller
{
    public function index(Request $request): Response
    {
        $tahun      = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $periodes = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->orderByRaw("FIELD(triwulan, 'TW1','TW2','TW3','TW4')")
            ->get();

        $periodeId = $request->integer('periode_id');
        $periode   = $periodeId
            ? $periodes->firstWhere('id', $periodeId)
            : ($periodes->firstWhere('is_active', true) ?? $periodes->first());

        $ikuList = [];

        if ($periode) {
            $twKey = strtolower($periode->triwulan);

            $pks = PerjanjianKinerja::with([
                'sasarans'                         => fn ($q) => $q->orderBy('kode'),
                'sasarans.indikators'              => fn ($q) => $q->whereHas(
                    'picTimKerjas', fn ($q2) => $q2->where('tim_kerja.id', $timKerjaId)
                )->orderBy('kode'),
                'sasarans.indikators.picTimKerjas',
                'sasarans.indikators.realisasis'   => fn ($q) => $q->with('inputByTimKerja')
                    ->where('periode_pengukuran_id', $periode->id),
            ])
                ->where('tahun_anggaran_id', $tahun->id)
                ->where('jenis', 'awal')
                ->get();

            foreach ($pks as $pk) {
                foreach ($pk->sasarans as $sasaran) {
                    foreach ($sasaran->indikators as $iku) {
                        $r = $iku->realisasis->first();

                        $ikuList[] = [
                            'iku_id'                  => $iku->id,
                            'sasaran_kode'            => $sasaran->kode,
                            'sasaran_nama'            => $sasaran->nama,
                            'iku_kode'                => $iku->kode,
                            'iku_nama'                => $iku->nama,
                            'iku_satuan'              => $iku->satuan,
                            'iku_target'              => $iku->target,
                            'iku_target_tw'           => $iku->{"target_{$twKey}"},
                            'pic_tim_kerjas'          => $iku->picTimKerjas->map(fn ($t) => [
                                'id'   => $t->id,
                                'nama' => $t->nama,
                                'kode' => $t->kode,
                                'nama_singkat' => $t->nama_singkat,
                            ]),
                            'realisasi_id'            => $r?->id,
                            'realisasi'               => $r?->realisasi,
                            'progress_kegiatan'       => $r?->progress_kegiatan,
                            'kendala'                 => $r?->kendala,
                            'strategi_tindak_lanjut'  => $r?->strategi_tindak_lanjut,
                            'catatan'                 => $r?->catatan,
                            'input_by_tim_kerja_id'   => $r?->input_by_tim_kerja_id,
                            'input_by_tim_kerja_nama' => $r?->inputByTimKerja?->nama_singkat ?? $r?->inputByTimKerja?->nama,
                        ];
                    }
                }
            }
        }

        return Inertia::render('KetuaTim/Pengukuran/Index', [
            'tahun'       => $tahun,
            'periodes'    => $periodes,
            'periode'     => $periode,
            'ikuList'     => $ikuList,
            'timKerjaId'  => $timKerjaId,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tahun      = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $data = $request->validate([
            'indikator_kinerja_id'   => ['required', 'integer', 'exists:indikator_kinerja,id'],
            'periode_pengukuran_id'  => ['required', 'integer', 'exists:periode_pengukuran,id'],
            'realisasi'              => ['nullable', 'string', 'max:100'],
            'progress_kegiatan'      => ['nullable', 'string', 'max:2000'],
            'kendala'                => ['nullable', 'string', 'max:2000'],
            'strategi_tindak_lanjut' => ['nullable', 'string', 'max:2000'],
            'catatan'                => ['nullable', 'string', 'max:1000'],
        ]);

        // Pastikan tim ini adalah PIC (primary atau co-PIC) untuk IKU ini
        $iku = IndikatorKinerja::whereHas('picTimKerjas', fn ($q) => $q->where('tim_kerja.id', $timKerjaId))
            ->where('id', $data['indikator_kinerja_id'])
            ->firstOrFail();

        $periode = PeriodePengukuran::where('id', $data['periode_pengukuran_id'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('is_active', true)
            ->firstOrFail();

        RealisasiKinerja::updateOrCreate(
            [
                'indikator_kinerja_id'  => $iku->id,
                'periode_pengukuran_id' => $periode->id,
            ],
            [
                'input_by_tim_kerja_id'  => $timKerjaId,
                'realisasi'              => $data['realisasi'],
                'progress_kegiatan'      => $data['progress_kegiatan'],
                'kendala'                => $data['kendala'],
                'strategi_tindak_lanjut' => $data['strategi_tindak_lanjut'],
                'catatan'                => $data['catatan'],
                'created_by'             => $request->user()->id,
            ]
        );

        return back()->with('success', 'Realisasi berhasil disimpan.');
    }
}
