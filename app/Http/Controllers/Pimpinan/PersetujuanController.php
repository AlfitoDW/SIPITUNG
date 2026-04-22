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

        // Hanya tampilkan RA yang punya indikator sendiri (primary PIC).
        // Co-PIC empty RAs tidak perlu direview terpisah — kontribusinya sudah
        // masuk ke RAI milik primary PIC dan disetujui bersama RA primary PIC.
        $ras = RencanaAksi::with(['timKerja', 'indikators.sasaran'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->whereIn('status', ['submitted', 'kabag_approved', 'rejected'])
            ->whereHas('indikators')
            ->orderByRaw("FIELD(status,'submitted','rejected','kabag_approved')")
            ->get()
            ->map(fn ($ra) => $this->mapRa($ra));

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

    private function mapRa(RencanaAksi $ra): array
    {
        $indikators = $ra->indikators;

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
            ])->values(),
        ];
    }
}
