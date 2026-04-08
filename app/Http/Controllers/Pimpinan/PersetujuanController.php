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
        $user  = auth()->user();

        $pksAwal = PerjanjianKinerja::with(['timKerja', 'sasarans.indikators.picTimKerjas'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->whereNotIn('status', ['draft'])
            ->orderByRaw("FIELD(status,'submitted','kabag_approved','rejected','ppk_approved')")
            ->get()
            ->map(fn ($pk) => $this->mapPk($pk));

        $pksRevisi = PerjanjianKinerja::with(['timKerja', 'sasarans.indikators.picTimKerjas'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'revisi')
            ->whereNotIn('status', ['draft'])
            ->orderByRaw("FIELD(status,'submitted','kabag_approved','rejected','ppk_approved')")
            ->get()
            ->map(fn ($pk) => $this->mapPk($pk));

        $ras = RencanaAksi::with(['timKerja', 'indikators.sasaran'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->whereNotIn('status', ['draft'])
            ->orderByRaw("FIELD(status,'submitted','kabag_approved','rejected','ppk_approved')")
            ->get()
            ->map(fn ($ra) => $this->mapRa($ra));

        $laporans = LaporanPengukuran::with(['timKerja', 'periode'])
            ->whereHas('periode', fn ($q) => $q->where('tahun_anggaran_id', $tahun->id))
            ->whereNotIn('status', ['draft'])
            ->orderBy('periode_pengukuran_id')
            ->orderBy('tim_kerja_id')
            ->get()
            ->map(fn ($l) => [
                'id'                => $l->id,
                'tim_kerja_nama'    => $l->timKerja?->nama ?? '',
                'tim_kerja_kode'    => $l->timKerja?->kode ?? '',
                'status'            => $l->status,
                'rekomendasi_kabag' => $l->rekomendasi_kabag,
                'submitted_at'      => $l->submitted_at?->format('d M Y H:i'),
                'approved_at'       => $l->approved_at?->format('d M Y H:i'),
                'periode_triwulan'  => $l->periode?->triwulan ?? '',
                'periode_id'        => $l->periode_pengukuran_id,
            ]);

        return Inertia::render('Pimpinan/Persetujuan/Index', [
            'tahun'      => $tahun,
            'pks_awal'   => $pksAwal,
            'pks_revisi' => $pksRevisi,
            'ras'        => $ras,
            'laporans'   => $laporans,
            'role'       => $user->pimpinan_type,
        ]);
    }

    private function mapPk(PerjanjianKinerja $pk): array
    {
        return [
            'id'                => $pk->id,
            'tim_kerja_nama'    => $pk->timKerja?->nama ?? '',
            'tim_kerja_kode'    => $pk->timKerja?->kode ?? '',
            'status'            => $pk->status,
            'rekomendasi_kabag' => $pk->rekomendasi_kabag,
            'rekomendasi_ppk'   => $pk->rekomendasi_ppk,
            'rejected_by'       => $pk->rejected_by,
            'updated_at'        => $pk->updated_at?->format('d M Y H:i'),
            'sasarans'          => $pk->sasarans->map(fn ($s) => [
                'id'         => $s->id,
                'kode'       => $s->kode,
                'nama'       => $s->nama,
                'indikators' => $s->indikators->map(fn ($i) => [
                    'id'             => $i->id,
                    'kode'           => $i->kode,
                    'nama'           => $i->nama,
                    'satuan'         => $i->satuan,
                    'target'         => $i->target,
                    'pic_tim_kerjas' => $i->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama']))->values(),
                ])->values(),
            ])->values(),
        ];
    }

    private function mapRa(RencanaAksi $ra): array
    {
        return [
            'id'                => $ra->id,
            'tim_kerja_nama'    => $ra->timKerja?->nama ?? '',
            'tim_kerja_kode'    => $ra->timKerja?->kode ?? '',
            'status'            => $ra->status,
            'rekomendasi_kabag' => $ra->rekomendasi_kabag,
            'rekomendasi_ppk'   => $ra->rekomendasi_ppk,
            'rejected_by'       => $ra->rejected_by,
            'updated_at'        => $ra->updated_at?->format('d M Y H:i'),
            'indikators'        => $ra->indikators->map(fn ($i) => [
                'id'         => $i->id,
                'kode'       => $i->kode,
                'nama'       => $i->nama,
                'satuan'     => $i->satuan,
                'target'     => $i->target,
                'target_tw1' => $i->target_tw1,
                'target_tw2' => $i->target_tw2,
                'target_tw3' => $i->target_tw3,
                'target_tw4' => $i->target_tw4,
                'sasaran'    => $i->sasaran
                    ? ['kode' => $i->sasaran->kode, 'nama' => $i->sasaran->nama]
                    : null,
            ])->values(),
        ];
    }
}
