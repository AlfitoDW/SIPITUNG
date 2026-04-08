<?php

namespace App\Http\Controllers\KetuaTim;

use App\Http\Controllers\Controller;
use App\Models\IndikatorKinerja;
use App\Models\LaporanPengukuran;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\RealisasiKinerja;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        // Cek status laporan untuk periode aktif
        $laporan = $periode ? LaporanPengukuran::where('tim_kerja_id', $timKerjaId)
            ->where('periode_pengukuran_id', $periode->id)
            ->first() : null;

        $collaboratorSubmittedBy = $periode
            ? $this->findCollaboratorSubmittedLaporan($periode->id, $timKerjaId)
            : null;

        return Inertia::render('KetuaTim/Pengukuran/Index', [
            'tahun'                  => $tahun,
            'periodes'               => $periodes,
            'periode'                => $periode,
            'ikuList'                => $ikuList,
            'timKerjaId'             => $timKerjaId,
            'laporan'                => $laporan ? [
                'id'                => $laporan->id,
                'status'            => $laporan->status,
                'submitted_at'      => $laporan->submitted_at?->format('d M Y H:i'),
                'rekomendasi_kabag' => $laporan->rekomendasi_kabag,
                'approved_at'       => $laporan->approved_at?->format('d M Y H:i'),
            ] : null,
            'collaboratorSubmittedBy'=> $collaboratorSubmittedBy,
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

    public function submit(Request $request): RedirectResponse
    {
        $tahun      = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $periodeId = $request->integer('periode_pengukuran_id');
        $periode   = PeriodePengukuran::where('id', $periodeId)
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('is_active', true)
            ->firstOrFail();

        // Pastikan tim ini punya IKU di periode ini
        $hasIku = RealisasiKinerja::whereHas('indikatorKinerja.picTimKerjas', fn ($q) =>
            $q->where('tim_kerja.id', $timKerjaId)
        )->where('periode_pengukuran_id', $periode->id)->exists();

        abort_if(! $hasIku, 422, 'Tidak ada realisasi untuk disubmit.');

        // Izinkan re-submit jika sebelumnya rejected
        $existing = LaporanPengukuran::where('tim_kerja_id', $timKerjaId)
            ->where('periode_pengukuran_id', $periode->id)
            ->first();

        abort_if(
            $existing && in_array($existing->status, ['submitted', 'kabag_approved']),
            422,
            'Laporan sudah disubmit atau sudah disetujui.'
        );

        LaporanPengukuran::updateOrCreate(
            ['tim_kerja_id' => $timKerjaId, 'periode_pengukuran_id' => $periode->id],
            [
                'status'            => 'submitted',
                'submitted_at'      => now(),
                'submitted_by'      => $request->user()->id,
                'rekomendasi_kabag' => null,
                'approved_at'       => null,
                'approved_by'       => null,
                'created_by'        => $request->user()->id,
            ]
        );

        return back()->with('success', 'Laporan pengukuran berhasil disubmit ke Kabag Umum.');
    }

    /**
     * Cek apakah ada tim lain (co-PIC pada IKU yang sama) yang sudah submit laporan periode ini.
     * Mengembalikan nama_singkat tim tersebut, atau null.
     */
    private function findCollaboratorSubmittedLaporan(int $periodeId, int $timKerjaId): ?string
    {
        // IKU yang melibatkan tim ini sebagai PIC (primary atau co-PIC)
        $sharedIkuIds = IndikatorKinerja::whereHas('picTimKerjas', fn ($q) =>
            $q->where('tim_kerja.id', $timKerjaId)
        )->pluck('id');

        if ($sharedIkuIds->isEmpty()) return null;

        // Tim lain yang juga PIC pada IKU yang sama
        $otherTeamIds = DB::table('indikator_kinerja_pic')
            ->whereIn('indikator_kinerja_id', $sharedIkuIds)
            ->where('tim_kerja_id', '!=', $timKerjaId)
            ->pluck('tim_kerja_id')
            ->unique();

        if ($otherTeamIds->isEmpty()) return null;

        $laporan = LaporanPengukuran::with('timKerja:id,nama_singkat,nama')
            ->where('periode_pengukuran_id', $periodeId)
            ->whereIn('tim_kerja_id', $otherTeamIds)
            ->where('status', 'submitted')
            ->first();

        return $laporan ? ($laporan->timKerja?->nama_singkat ?? $laporan->timKerja?->nama) : null;
    }
}
