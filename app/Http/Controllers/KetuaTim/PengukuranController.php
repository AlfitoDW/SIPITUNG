<?php

namespace App\Http\Controllers\KetuaTim;

use App\Http\Controllers\Controller;
use App\Models\IndikatorKinerja;
use App\Models\LaporanPengukuran;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\RealisasiKinerja;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
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

        $ikuList      = [];
        $collabGroups = [];

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
                                'id'           => $t->id,
                                'nama'         => $t->nama,
                                'kode'         => $t->kode,
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

            // Bangun kelompok kolaborasi
            $collabGroups = $this->buildCollaborationGroups($timKerjaId, $tahun->id, $periode->id, $ikuList);
        }

        return Inertia::render('KetuaTim/Pengukuran/Index', [
            'tahun'        => $tahun,
            'periodes'     => $periodes,
            'periode'      => $periode,
            'ikuList'      => $ikuList,
            'timKerjaId'   => $timKerjaId,
            'collabGroups' => $collabGroups,
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

        // Pastikan tidak ada laporan yang sudah submitted/approved untuk kelompok IKU ini
        $peerIds = DB::table('indikator_kinerja_pic')
            ->where('indikator_kinerja_id', $iku->id)
            ->where('tim_kerja_id', '!=', $timKerjaId)
            ->pluck('tim_kerja_id');

        foreach ($peerIds as $peerId) {
            $existingLaporan = LaporanPengukuran::where('tim_kerja_id', $timKerjaId)
                ->where('periode_pengukuran_id', $periode->id)
                ->where('peer_tim_kerja_id', $peerId)
                ->whereIn('status', ['submitted', 'kabag_approved'])
                ->first();

            abort_if($existingLaporan, 422, 'Laporan untuk kelompok IKU ini sudah disubmit.');
        }

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

    /**
     * Submit laporan untuk satu kelompok kolaborasi (per peer_tim_kerja_id).
     */
    public function submit(Request $request): RedirectResponse
    {
        $tahun      = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $periodeId    = $request->integer('periode_pengukuran_id');
        $peerTimKerjaId = $request->input('peer_tim_kerja_id'); // null atau integer
        $peerTimKerjaId = $peerTimKerjaId !== null ? (int) $peerTimKerjaId : null;

        $periode = PeriodePengukuran::where('id', $periodeId)
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('is_active', true)
            ->firstOrFail();

        // Dapatkan IKU untuk kelompok ini
        $ikuIds = $this->getIkuIdsForGroup($timKerjaId, $tahun->id, $peerTimKerjaId);

        abort_if(empty($ikuIds), 422, 'Tidak ada IKU dalam kelompok ini.');

        // Cek realisasi sudah ada untuk semua IKU kelompok ini
        $hasRealisasi = RealisasiKinerja::whereIn('indikator_kinerja_id', $ikuIds)
            ->where('periode_pengukuran_id', $periode->id)
            ->exists();

        abort_if(! $hasRealisasi, 422, 'Belum ada realisasi yang diisi untuk kelompok IKU ini.');

        // Cek apakah peer sudah submit duluan untuk pasangan ini
        if ($peerTimKerjaId !== null) {
            $peerLaporan = LaporanPengukuran::where('tim_kerja_id', $peerTimKerjaId)
                ->where('periode_pengukuran_id', $periode->id)
                ->where('peer_tim_kerja_id', $timKerjaId)
                ->whereIn('status', ['submitted', 'kabag_approved'])
                ->first();

            abort_if(
                $peerLaporan,
                403,
                ($peerLaporan?->timKerja?->nama_singkat ?? 'Tim lain') . ' telah mengajukan laporan untuk kelompok IKU ini.'
            );
        }

        // Izinkan re-submit jika sebelumnya rejected
        $existing = LaporanPengukuran::where('tim_kerja_id', $timKerjaId)
            ->where('periode_pengukuran_id', $periode->id)
            ->where('peer_tim_kerja_id', $peerTimKerjaId)
            ->first();

        abort_if(
            $existing && in_array($existing->status, ['submitted', 'kabag_approved']),
            422,
            'Laporan kelompok ini sudah disubmit atau sudah disetujui.'
        );

        LaporanPengukuran::updateOrCreate(
            [
                'tim_kerja_id'          => $timKerjaId,
                'periode_pengukuran_id' => $periode->id,
                'peer_tim_kerja_id'     => $peerTimKerjaId,
            ],
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

        $peerName = $peerTimKerjaId
            ? (TimKerja::find($peerTimKerjaId)?->nama_singkat ?? 'tim partner')
            : 'IKU mandiri';

        return back()->with('success', "Laporan kelompok {$peerName} berhasil disubmit ke Kabag Umum.");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    /**
     * Bangun kelompok kolaborasi untuk tim ini pada periode tertentu.
     *
     * Setiap kelompok = pasangan (timKerjaId, peerTimKerjaId).
     * Satu IKU bisa masuk ke beberapa kelompok jika punya > 1 co-PIC.
     *
     * Return: array kelompok, masing-masing berisi:
     *   - peer_id        : int|null (null = IKU solo tanpa co-PIC lain)
     *   - peer_nama      : string
     *   - iku_ids        : int[]
     *   - filled_count   : int  (IKU yang sudah ada realisasinya)
     *   - iku_count      : int
     *   - laporan        : array|null  (status laporan tim ini untuk kelompok ini)
     *   - collaborator   : array|null  (status laporan peer untuk pasangan yang sama)
     *   - collab_rejected: array|null  (laporan peer yang rejected)
     */
    private function buildCollaborationGroups(
        int $timKerjaId,
        int $tahunId,
        int $periodeId,
        array $ikuList
    ): array {
        if (empty($ikuList)) return [];

        $ikuById = collect($ikuList)->keyBy('iku_id');

        // Kelompokkan IKU berdasarkan peer co-PIC dari perspektif tim ini.
        // IKU dengan HANYA 1 PIC (tim ini saja, atau primary saja) → peer_id = null.
        // IKU dengan 2+ PICs → satu entry per peer lain.
        $groupMap = []; // peer_id (string 'null' untuk null) => [iku_id, ...]

        foreach ($ikuList as $iku) {
            $otherPics = collect($iku['pic_tim_kerjas'])
                ->filter(fn ($t) => $t['id'] !== $timKerjaId)
                ->values();

            if ($otherPics->isEmpty()) {
                $groupMap['null'][] = $iku['iku_id'];
            } else {
                foreach ($otherPics as $peer) {
                    $groupMap[(string) $peer['id']][] = $iku['iku_id'];
                }
            }
        }

        // Load semua laporan tim ini untuk periode ini.
        // Gunakan PHP loop eksplisit agar selalu menyimpan record dengan status TERBAIK
        // per peer_key (keyBy() tidak aman jika ada >1 record per peer_key).
        $lapSpx = ['kabag_approved' => 3, 'submitted' => 2, 'rejected' => 1, 'draft' => 0];
        $myLaporans = [];
        foreach (
            LaporanPengukuran::where('tim_kerja_id', $timKerjaId)
                ->where('periode_pengukuran_id', $periodeId)
                ->get() as $_l
        ) {
            $_pk = $_l->peer_tim_kerja_id === null ? 'null' : (string) $_l->peer_tim_kerja_id;
            if (
                !array_key_exists($_pk, $myLaporans) ||
                ($lapSpx[$_l->status] ?? -1) > ($lapSpx[$myLaporans[$_pk]->status] ?? -1)
            ) {
                $myLaporans[$_pk] = $_l;
            }
        }
        $myLaporans = collect($myLaporans); // jadikan Collection agar ->get() bisa dipakai

        // Load laporan peer untuk setiap pair
        $peerIds = collect(array_keys($groupMap))
            ->filter(fn ($k) => $k !== 'null')
            ->map(fn ($k) => (int) $k)
            ->values()
            ->all();

        $peerLaporans = LaporanPengukuran::with('timKerja:id,nama_singkat,nama')
            ->where('periode_pengukuran_id', $periodeId)
            ->whereIn('tim_kerja_id', $peerIds)
            ->orderByRaw("FIELD(status,'draft','rejected','submitted','kabag_approved')")
            ->get();

        // Realisasi yang sudah diisi per IKU
        $allIkuIds = collect($ikuList)->pluck('iku_id')->all();
        $filledIkuIds = RealisasiKinerja::where('periode_pengukuran_id', $periodeId)
            ->whereIn('indikator_kinerja_id', $allIkuIds)
            ->pluck('indikator_kinerja_id')
            ->flip();

        // Peers info
        $peersById = TimKerja::whereIn('id', $peerIds)->get()->keyBy('id');

        $result = [];
        foreach ($groupMap as $peerKey => $ikuIds) {
            $peerId   = $peerKey === 'null' ? null : (int) $peerKey;
            $peerInfo = $peerId ? $peersById->get($peerId) : null;

            $myLaporan = $myLaporans->get($peerKey);

            // Cari laporan peer terbaik yang cover pasangan ini
            // (peer submit dengan peer_tim_kerja_id = timKerjaId).
            // sortByDesc memastikan jika ada rejected + approved, kita ambil yang approved.
            $peerLaporan = $peerId
                ? $peerLaporans
                    ->filter(
                        fn ($l) => $l->tim_kerja_id === $peerId && $l->peer_tim_kerja_id === $timKerjaId
                    )
                    ->sortByDesc(fn ($l) => match ($l->status) {
                        'kabag_approved' => 3,
                        'submitted'      => 2,
                        'draft'          => 1,
                        default          => 0,
                    })
                    ->first()
                : null;

            $filledCount = collect($ikuIds)->filter(fn ($id) => $filledIkuIds->has($id))->count();

            $result[] = [
                'peer_id'         => $peerId,
                'peer_nama'       => $peerInfo?->nama_singkat ?? $peerInfo?->nama ?? 'Mandiri',
                'iku_ids'         => $ikuIds,
                'iku_count'       => count($ikuIds),
                'filled_count'    => $filledCount,
                'laporan'         => $myLaporan ? [
                    'id'                => $myLaporan->id,
                    'status'            => $myLaporan->status,
                    'submitted_at'      => $myLaporan->submitted_at?->format('d M Y H:i'),
                    'rekomendasi_kabag' => $myLaporan->rekomendasi_kabag,
                    'approved_at'       => $myLaporan->approved_at?->format('d M Y H:i'),
                ] : null,
                'collaborator'    => ($peerLaporan && in_array($peerLaporan->status, ['submitted', 'kabag_approved'])) ? [
                    'nama'   => $peerLaporan->timKerja?->nama_singkat ?? $peerLaporan->timKerja?->nama,
                    'status' => $peerLaporan->status,
                ] : null,
                'collab_rejected' => ($peerLaporan && $peerLaporan->status === 'rejected') ? [
                    'nama'              => $peerLaporan->timKerja?->nama_singkat ?? $peerLaporan->timKerja?->nama,
                    'rekomendasi_kabag' => $peerLaporan->rekomendasi_kabag,
                ] : null,
            ];
        }

        return $result;
    }

    /**
     * Dapatkan IKU IDs untuk satu kelompok kolaborasi
     * (tim ini sebagai PIC bersama peer_tim_kerja_id tertentu, atau solo jika null).
     */
    private function getIkuIdsForGroup(int $timKerjaId, int $tahunId, ?int $peerTimKerjaId): array
    {
        $query = DB::table('indikator_kinerja_pic as p1')
            ->join('indikator_kinerja as iku', 'iku.id', '=', 'p1.indikator_kinerja_id')
            ->join('sasaran', 'sasaran.id', '=', 'iku.sasaran_id')
            ->join('perjanjian_kinerja', 'perjanjian_kinerja.id', '=', 'sasaran.perjanjian_kinerja_id')
            ->where('perjanjian_kinerja.tahun_anggaran_id', $tahunId)
            ->where('perjanjian_kinerja.jenis', 'awal')
            ->where('p1.tim_kerja_id', $timKerjaId);

        if ($peerTimKerjaId === null) {
            // Solo: IKU di mana tidak ada PIC lain selain tim ini
            $query->whereNotExists(function ($sub) use ($timKerjaId) {
                $sub->select(DB::raw(1))
                    ->from('indikator_kinerja_pic as p2')
                    ->whereColumn('p2.indikator_kinerja_id', 'p1.indikator_kinerja_id')
                    ->where('p2.tim_kerja_id', '!=', $timKerjaId);
            });
        } else {
            // Kelompok dengan peer: IKU di mana peer juga menjadi PIC
            $query->whereExists(function ($sub) use ($peerTimKerjaId) {
                $sub->select(DB::raw(1))
                    ->from('indikator_kinerja_pic as p2')
                    ->whereColumn('p2.indikator_kinerja_id', 'p1.indikator_kinerja_id')
                    ->where('p2.tim_kerja_id', $peerTimKerjaId);
            });
        }

        return $query->pluck('p1.indikator_kinerja_id')->unique()->values()->all();
    }
}
