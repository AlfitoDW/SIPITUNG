<?php

namespace Database\Seeders;

use App\Models\PermohonanDana;
use App\Models\PermohonanDanaItem;
use App\Models\PermohonanDanaItemNominatif;
use App\Models\RefNama;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class NominatifSeeder extends Seeder
{
    private const NOMOR_FIXTURE = '999/LL3/NOMINATIF-ALL/V/2026';

    public function run(): void
    {
        $pegawai = RefNama::where('is_aktif', true)->orderBy('id')->take(15)->get()->values();
        if ($pegawai->count() < 10) {
            $this->command->warn('NominatifSeeder: Minimal butuh 10 data ref_nama aktif. Lewati.');

            return;
        }

        PermohonanDana::where('nomor_permohonan', self::NOMOR_FIXTURE)->delete();

        $now = Carbon::now();
        $pd = PermohonanDana::create([
            'tahun_anggaran_id' => 2,
            'tim_kerja_id' => 1,
            'nomor_permohonan' => self::NOMOR_FIXTURE,
            'judul_pekerjaan' => 'Fixture Export Nominatif Semua Akun',
            'keperluan' => 'Data uji export nominatif untuk seluruh nomor akun dalam satu Excel',
            'tanggal_mulai' => '2026-05-12',
            'tanggal_selesai' => '2026-05-14',
            'tempat' => 'Jakarta',
            'no_sk' => 'SK-NOMINATIF-ALL/V/2026',
            'tgl_sk' => '2026-05-10',
            'no_st' => 'ST-NOMINATIF-ALL/V/2026',
            'tgl_st' => '2026-05-12',
            'total_anggaran' => 0,
            'status' => 'dicairkan',
            'wizard_step' => 4,
            'created_by' => 5,
            'kapokja_id' => 5,
            'tgl_nominatif' => '2026-05-15',
            'submitted_at' => $now,
            'katim_approved_by' => 1,
            'katim_approved_at' => $now,
            'kabag_approved_by' => 2,
            'kabag_approved_at' => $now,
            'ppk_approved_by' => 3,
            'ppk_approved_at' => $now,
            'pic_approved_by' => 3,
            'pic_approved_at' => $now,
            'dicairkan_by' => 4,
            'dicairkan_at' => '2026-05-15',
            'catatan_pencairan' => 'Fixture export nominatif semua akun',
        ]);

        $total = 0;
        $total += $this->createHonorItem($pd, $pegawai, '521115', 'Honor Operasional Satuan Kerja', 680000, 1);
        $total += $this->createHonorItem($pd, $pegawai, '521213', 'Honor Panitia Kegiatan', 400000, 2);
        $total += $this->createHonorItem($pd, $pegawai, '522151', 'Honor Narasumber dan Moderator', 900000, 3);
        $total += $this->createPerjadinItem($pd, $pegawai, '524111', 'Perjalanan Dinas Biasa Luar Kota', 4, true);
        $total += $this->createPerjadinItem($pd, $pegawai, '524113', 'Perjalanan Dinas Dalam Kota', 5, false);
        $total += $this->createPerjadinItem($pd, $pegawai, '524114', 'Paket Meeting Dalam Kota', 6, false);
        $total += $this->createPerjadinItem($pd, $pegawai, '524119', 'Paket Meeting Luar Kota', 7, true);

        $pd->update(['total_anggaran' => $total]);

        $this->command->info('NominatifSeeder: Fixture satu Excel semua akun dibuat: '.self::NOMOR_FIXTURE);
    }

    private function createHonorItem(PermohonanDana $pd, $pegawai, string $kodeAkun, string $uraian, int $harga, int $urutan): float
    {
        $rows = $pegawai->values();

        $total = $harga * $rows->count();
        $item = PermohonanDanaItem::create([
            'permohonan_dana_id' => $pd->id,
            'dja_rincian_biaya_id' => null,
            'kode_akun' => $kodeAkun,
            'uraian' => $uraian,
            'volume' => $rows->count(),
            'satuan' => 'ORG',
            'harga_satuan' => $harga,
            'total' => $total,
            'jumlah_permintaan' => $total,
            'urutan' => $urutan,
        ]);

        foreach ($rows as $idx => $p) {
            $bruto = $harga;
            $pajak = round($bruto * ((float) $p->pph21_persen / 100), 2);
            $this->createNominatifBase($pd, $item, $p, $idx + 1, [
                'jabatan' => $kodeAkun === '522151' ? ($idx === 0 ? 'Narasumber' : 'Moderator') : 'Pelaksana',
                'volume' => 1,
                'harga_satuan' => $harga,
                'jumlah_bruto' => $bruto,
                'jumlah_pajak' => $pajak,
                'jumlah_diterima' => $bruto - $pajak,
            ]);
        }

        return $total;
    }

    private function createPerjadinItem(PermohonanDana $pd, $pegawai, string $kodeAkun, string $uraian, int $urutan, bool $luarKota): float
    {
        $rows = $pegawai->values();

        $perOrang = $luarKota ? 4749000 : 1285000;
        $total = $perOrang * $rows->count();
        $item = PermohonanDanaItem::create([
            'permohonan_dana_id' => $pd->id,
            'dja_rincian_biaya_id' => null,
            'kode_akun' => $kodeAkun,
            'uraian' => $uraian,
            'volume' => $rows->count(),
            'satuan' => 'ORG',
            'harga_satuan' => $perOrang,
            'total' => $total,
            'jumlah_permintaan' => $total,
            'urutan' => $urutan,
        ]);

        foreach ($rows as $idx => $p) {
            $values = $luarKota
                ? [
                    'uang_harian_vol' => 2,
                    'uang_harian_satuan' => 430000,
                    'uang_harian_jumlah' => 860000,
                    'fullboard_vol' => 1,
                    'fullboard_satuan' => 350000,
                    'fullboard_jumlah' => 350000,
                    'fullday_vol' => 1,
                    'fullday_satuan' => 250000,
                    'fullday_jumlah' => 250000,
                    'transport' => 284000,
                    'taksi_pp' => 200000,
                    'tiket_pesawat' => 2500000,
                    'hotel' => 305000,
                    'jumlah_perjadin' => $perOrang,
                ]
                : [
                    'uang_harian_vol' => 1,
                    'uang_harian_satuan' => 210000,
                    'uang_harian_jumlah' => 210000,
                    'fullboard_vol' => 1,
                    'fullboard_satuan' => 350000,
                    'fullboard_jumlah' => 350000,
                    'fullday_vol' => 1,
                    'fullday_satuan' => 250000,
                    'fullday_jumlah' => 250000,
                    'transport' => 170000,
                    'hotel' => 305000,
                    'jumlah_perjadin' => $perOrang,
                ];

            $this->createNominatifBase($pd, $item, $p, $idx + 1, $values);
        }

        return $total;
    }

    private function createNominatifBase(PermohonanDana $pd, PermohonanDanaItem $item, RefNama $p, int $urutan, array $values): void
    {
        PermohonanDanaItemNominatif::create(array_merge([
            'permohonan_dana_item_id' => $item->id,
            'permohonan_dana_id' => $pd->id,
            'ref_nama_id' => $p->id,
            'nama' => $p->nama,
            'nip' => $p->nip,
            'nik' => $p->nik,
            'npwp' => $p->npwp,
            'gol_ruang' => $p->gol_ruang,
            'nama_rekening' => $p->nama_rekening,
            'no_rekening' => $p->no_rekening,
            'nama_bank' => $p->nama_bank,
            'email' => $p->email,
            'pph21_persen' => $p->pph21_persen ?? 0,
            'urutan' => $urutan,
        ], $values));
    }
}
