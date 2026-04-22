<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\LaporanPengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksi;
use App\Models\TahunAnggaran;
use Inertia\Inertia;
use Inertia\Response;

class PersetujuanController extends Controller
{
    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $user = auth()->user();

        // Bangun merged sasarans dari SEMUA PK per jenis (bukan hanya yang submitted)
        // agar IKU yang tersebar di beberapa PK tetap tampil di card persetujuan
        $mergedAwal = $this->buildMergedSasarans($tahun->id, 'awal');
        $mergedRevisi = $this->buildMergedSasarans($tahun->id, 'revisi');

        $pksAwal = PerjanjianKinerja::with(['timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->whereNotIn('status', ['draft'])
            ->orderByRaw("FIELD(status,'submitted','rejected','kabag_approved')")
            ->get()
            ->map(fn ($pk) => $this->mapPk($pk, $mergedAwal));

        $pksRevisi = PerjanjianKinerja::with(['timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'revisi')
            ->whereNotIn('status', ['draft'])
            ->orderByRaw("FIELD(status,'submitted','rejected','kabag_approved')")
            ->get()
            ->map(fn ($pk) => $this->mapPk($pk, $mergedRevisi));

        // Preload semua RA (semua status) untuk dipakai mirror lookup di mapRa.
        // Key: "tim_kerja_id|peer_tim_kerja_id" agar lookup O(1).
        $allRas = RencanaAksi::with(['indikators.sasaran', 'indikators.kegiatans'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->get()
            ->keyBy(fn ($r) => $r->tim_kerja_id . '|' . ($r->peer_tim_kerja_id ?? 'null'));

        // Kumpulkan key RA yang sudah ada di hub (submitted/approved/rejected) untuk deteksi mirror.
        // Ini mencegah co-PIC RA yang kosong muncul sebagai duplikat dari primary RA.
        $submittedRaKeys = RencanaAksi::where('tahun_anggaran_id', $tahun->id)
            ->whereIn('status', ['submitted', 'kabag_approved', 'rejected'])
            ->get(['tim_kerja_id', 'peer_tim_kerja_id'])
            ->mapWithKeys(fn ($ra) => [$ra->tim_kerja_id . '|' . ($ra->peer_tim_kerja_id ?? 'null') => true]);

        // Tampilkan semua RA yang sudah submit. Co-PIC RA yang benar-benar kosong (tidak punya
        // indikator sendiri) disembunyikan jika primary mirror RA-nya sudah ada di hub —
        // mencegah tampilan duplikat ketika kedua tim submit secara independen.
        $ras = RencanaAksi::with(['timKerja', 'indikators.sasaran', 'indikators.kegiatans'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->whereIn('status', ['submitted', 'kabag_approved', 'rejected'])
            ->orderByRaw("FIELD(status,'submitted','rejected','kabag_approved')")
            ->get()
            ->filter(function ($ra) use ($submittedRaKeys) {
                // Hanya filter keluar jika: RA ini tidak punya indikator sendiri (co-PIC kosong)
                // DAN mirror primary RA-nya sudah ada di hub.
                if ($ra->indikators->isEmpty() && $ra->peer_tim_kerja_id !== null) {
                    $mirrorKey = $ra->peer_tim_kerja_id . '|' . $ra->tim_kerja_id;
                    return ! isset($submittedRaKeys[$mirrorKey]);
                }
                return true;
            })
            ->map(fn ($ra) => $this->mapRa($ra, $allRas))
            ->values();

        $laporans = LaporanPengukuran::with(['timKerja', 'periode'])
            ->whereHas('periode', fn ($q) => $q->where('tahun_anggaran_id', $tahun->id))
            ->whereIn('status', ['submitted', 'kabag_approved', 'rejected'])
            ->orderByRaw("FIELD(status,'submitted','rejected','kabag_approved')")
            ->orderBy('periode_pengukuran_id')
            ->orderBy('tim_kerja_id')
            ->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'tim_kerja_nama' => $l->timKerja?->nama ?? '',
                'tim_kerja_kode' => $l->timKerja?->kode ?? '',
                'status' => $l->status,
                'rekomendasi_kabag' => $l->rekomendasi_kabag,
                'submitted_at' => $l->submitted_at?->format('d M Y H:i'),
                'approved_at' => $l->approved_at?->format('d M Y H:i'),
                'periode_triwulan' => $l->periode?->triwulan ?? '',
                'periode_id' => $l->periode_pengukuran_id,
            ]);

        return Inertia::render('Pimpinan/Persetujuan/Index', [
            'tahun' => $tahun,
            'pks_awal' => $pksAwal,
            'pks_revisi' => $pksRevisi,
            'ras' => $ras,
            'laporans' => $laporans,
            'role' => $user->pimpinan_type,
        ]);
    }

    /**
     * Map PK ke array untuk frontend.
     * $mergedSasarans: hasil buildMergedSasarans — digunakan sebagai sumber IKU
     * agar IKU yang tersebar di beberapa PK tetap tampil meski PK ini sendiri sudah kosong.
     */
    private function mapPk(PerjanjianKinerja $pk, array $mergedSasarans): array
    {
        return [
            'id' => $pk->id,
            'tim_kerja_nama' => $pk->timKerja?->nama ?? '',
            'tim_kerja_kode' => $pk->timKerja?->kode ?? '',
            'status' => $pk->status,
            'rekomendasi_kabag' => $pk->rekomendasi_kabag,
            'updated_at' => $pk->updated_at?->format('d M Y H:i'),
            'sasarans' => $mergedSasarans,
        ];
    }

    /**
     * Bangun merged sasarans dari SEMUA PK untuk tahun & jenis tertentu.
     * Menggabungkan IKU yang mungkin tersebar di beberapa PK milik tim kerja berbeda.
     */
    private function buildMergedSasarans(int $tahunId, string $jenis): array
    {
        $pks = PerjanjianKinerja::with([
            'sasarans' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators.picTimKerjas',
        ])
            ->where('tahun_anggaran_id', $tahunId)
            ->where('jenis', $jenis)
            ->get();

        $sasaranMap = [];
        foreach ($pks as $pk) {
            foreach ($pk->sasarans as $s) {
                if (! isset($sasaranMap[$s->kode])) {
                    $sasaranMap[$s->kode] = ['id' => $s->id, 'kode' => $s->kode, 'nama' => $s->nama, 'indikators' => []];
                }
                foreach ($s->indikators as $i) {
                    $sasaranMap[$s->kode]['indikators'][] = [
                        'id' => $i->id,
                        'kode' => $i->kode,
                        'nama' => $i->nama,
                        'satuan' => $i->satuan,
                        'target' => $i->target,
                        'pic_tim_kerjas' => $i->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama']))->values(),
                    ];
                }
            }
        }

        ksort($sasaranMap);

        // Buang sasaran orphan (tanpa indikator) agar tidak tampil sebagai baris kosong
        return array_values(array_filter($sasaranMap, fn ($s) => count($s['indikators']) > 0));
    }

    private function mapRa(RencanaAksi $ra, \Illuminate\Support\Collection $allRas): array
    {
        $indikators = $ra->indikators;

        // Co-PIC RA (kosong): pinjam indikators dari EXACT mirror RA saja.
        // Mirror = RA milik peer yang peer_tim_kerja_id-nya menunjuk kembali ke tim ini.
        // Dengan ini, kolaborasi Penjamu↔KK tidak ikut membawa IKU dari Penjamu↔Belmawa.
        if ($indikators->isEmpty() && $ra->peer_tim_kerja_id !== null) {
            $mirrorKey = $ra->peer_tim_kerja_id . '|' . $ra->tim_kerja_id;
            $mirrorRa  = $allRas->get($mirrorKey);
            if ($mirrorRa && $mirrorRa->indikators->isNotEmpty()) {
                $indikators = $mirrorRa->indikators;
            }
        }

        return [
            'id' => $ra->id,
            'tim_kerja_nama' => $ra->timKerja?->nama ?? '',
            'tim_kerja_kode' => $ra->timKerja?->kode ?? '',
            'status' => $ra->status,
            'rekomendasi_kabag' => $ra->rekomendasi_kabag,
            'updated_at' => $ra->updated_at?->format('d M Y H:i'),
            'indikators' => $indikators->map(fn ($i) => [
                'id' => $i->id,
                'kode' => $i->kode,
                'nama' => $i->nama,
                'satuan' => $i->satuan,
                'target' => $i->target,
                'target_tw1' => $i->target_tw1,
                'target_tw2' => $i->target_tw2,
                'target_tw3' => $i->target_tw3,
                'target_tw4' => $i->target_tw4,
                'sasaran' => $i->sasaran
                    ? ['kode' => $i->sasaran->kode, 'nama' => $i->sasaran->nama]
                    : null,
                'kegiatans' => $i->kegiatans
                    ->sortBy(['triwulan', 'urutan'])
                    ->map(fn ($k) => [
                        'id' => $k->id,
                        'triwulan' => $k->triwulan,
                        'urutan' => $k->urutan,
                        'nama_kegiatan' => $k->nama_kegiatan,
                    ])->values(),
            ])->values(),
        ];
    }
}
