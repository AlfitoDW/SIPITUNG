<?php

namespace Database\Seeders;

use App\Models\PermohonanDana;
use App\Models\PermohonanDanaItem;
use App\Models\PermohonanDanaItemNominatif;
use App\Models\RefNama;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NominatifSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $tglMulai = '2026-05-12';
        $tglSelesai = '2026-05-14';
        $tglDicairkan = '2026-05-15';
        $tglNominatif = '2026-05-15';

        $timKerjaId = 1;          // TK-PK
        $createdBy = 5;           // Raafita Agustiana (ketua TK-PK)
        $dicairkanBy = 4;         // Bendahara
        $ppkApprovedBy = 3;       // Agung Permana N (PPK)
        $katimApprovedBy = 1;     // superadmin (atau pimpinan kabag)
        $kabagApprovedBy = 2;     // Tri Munanto (kabag umum)
        $tahunAnggaranId = 2;     // 2026

        // Ambil pegawai aktif
        $pegawaiAll = RefNama::where('is_aktif', true)
            ->orderBy('id')
            ->get()
            ->keyBy('id');

        if ($pegawaiAll->isEmpty()) {
            $this->command->warn('NominatifSeeder: Tidak ada data ref_nama aktif. Lewati.');
            return;
        }

        $this->command->info('NominatifSeeder: Membuat 5 permohonan dana (dicairkan)…');

        // ─────────────────────────────────────────────────────────────────
        // 1. 521115 — Honor Operasional Satuan Kerja
        // ─────────────────────────────────────────────────────────────────
        $this->seedHonor521115($pegawaiAll, $timKerjaId, $createdBy, $dicairkanBy,
            $ppkApprovedBy, $katimApprovedBy, $kabagApprovedBy,
            $tahunAnggaranId, $tglMulai, $tglSelesai, $tglDicairkan, $tglNominatif, $now);

        // ─────────────────────────────────────────────────────────────────
        // 2. 521213 — Honor Output Kegiatan
        // ─────────────────────────────────────────────────────────────────
        $this->seedHonor521213($pegawaiAll, $timKerjaId, $createdBy, $dicairkanBy,
            $ppkApprovedBy, $katimApprovedBy, $kabagApprovedBy,
            $tahunAnggaranId, $tglMulai, $tglSelesai, $tglDicairkan, $tglNominatif, $now);

        // ─────────────────────────────────────────────────────────────────
        // 3. 524111 — Perjalanan Dinas Luar Kota
        // ─────────────────────────────────────────────────────────────────
        $this->seedPerjadin524111($pegawaiAll, $timKerjaId, $createdBy, $dicairkanBy,
            $ppkApprovedBy, $katimApprovedBy, $kabagApprovedBy,
            $tahunAnggaranId, $tglMulai, $tglSelesai, $tglDicairkan, $tglNominatif, $now);

        // ─────────────────────────────────────────────────────────────────
        // 4. 524119 — Perjalanan Dinas Paket Meeting (belum ada di DJA)
        // ─────────────────────────────────────────────────────────────────
        $this->seedPerjadin524119($pegawaiAll, $timKerjaId, $createdBy, $dicairkanBy,
            $ppkApprovedBy, $katimApprovedBy, $kabagApprovedBy,
            $tahunAnggaranId, $tglMulai, $tglSelesai, $tglDicairkan, $tglNominatif, $now);

        // ─────────────────────────────────────────────────────────────────
        // 5. 524114 — Perjalanan Dinas Dalam Kota (belum ada di DJA)
        // ─────────────────────────────────────────────────────────────────
        $this->seedPerjadin524114($pegawaiAll, $timKerjaId, $createdBy, $dicairkanBy,
            $ppkApprovedBy, $katimApprovedBy, $kabagApprovedBy,
            $tahunAnggaranId, $tglMulai, $tglSelesai, $tglDicairkan, $tglNominatif, $now);

        $this->command->info('NominatifSeeder: Selesai.');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 521115 — Honor Operasional Satuan Kerja
    // ═══════════════════════════════════════════════════════════════════════
    private function seedHonor521115(
        $pegawaiAll, $timKerjaId, $createdBy, $dicairkanBy,
        $ppkApprovedBy, $katimApprovedBy, $kabagApprovedBy,
        $tahunAnggaranId, $tglMulai, $tglSelesai, $tglDicairkan, $tglNominatif, $now
    ): void {
        $nomor = '016/LL3/PerD/V/2026';
        $pd = PermohonanDana::firstOrCreate(
            ['nomor_permohonan' => $nomor],
            [
                'tahun_anggaran_id' => $tahunAnggaranId,
                'tim_kerja_id' => $timKerjaId,
                'judul_pekerjaan' => 'Honorarium Pengelolaan Barang Milik Negara',
                'keperluan' => 'Pembayaran honorarium pengelolaan BMN Triwulan II 2026',
                'tanggal_mulai' => $tglMulai,
                'tanggal_selesai' => $tglSelesai,
                'tempat' => 'Kantor LLDIKTI Wilayah III',
                'no_sk' => 'SK-521115/V/2026',
                'tgl_sk' => '2026-05-10',
                'total_anggaran' => 0,
                'status' => 'dicairkan',
                'wizard_step' => 4,
                'created_by' => $createdBy,
                'kapokja_id' => $createdBy,
                'tgl_nominatif' => $tglNominatif,
                'submitted_at' => $now,
                'katim_approved_by' => $katimApprovedBy,
                'katim_approved_at' => $now,
                'kabag_approved_by' => $kabagApprovedBy,
                'kabag_approved_at' => $now,
                'ppk_approved_by' => $ppkApprovedBy,
                'ppk_approved_at' => $now,
                'pic_approved_by' => $ppkApprovedBy,
                'pic_approved_at' => $now,
                'dicairkan_by' => $dicairkanBy,
                'dicairkan_at' => $tglDicairkan,
                'catatan_pencairan' => 'Dicairkan penuh sesuai nominatif',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        if ($pd->wasRecentlyCreated === false) {
            $this->command->info("  {$nomor} sudah ada, dilewati.");
            return;
        }

        // Item: Honorarium Pejabat Pengadaan Barang/Jasa (dja_id=320)
        // pagu 16.320.000, harga 680.000, vol_default 24
        $harga = 680000;
        $volume = 3;
        $total = $harga * $volume;

        $item = PermohonanDanaItem::create([
            'permohonan_dana_id' => $pd->id,
            'dja_rincian_biaya_id' => 320,
            'kode_akun' => '521115',
            'uraian' => 'Honorarium Pejabat Pengadaan Barang/Jasa',
            'volume' => $volume,
            'satuan' => 'ORG',
            'harga_satuan' => $harga,
            'total' => $total,
            'jumlah_permintaan' => $total,
            'urutan' => 1,
        ]);

        $pesertaIds = [16, 17, 15]; // Agung Permana N, Agus Muhammad Ali, Afrida Anis
        $urutan = 1;
        foreach ($pesertaIds as $pid) {
            $p = $pegawaiAll[$pid] ?? null;
            if (! $p) continue;
            $bruto = $harga;
            $pajak = round($bruto * ($p->pph21_persen / 100), 2);
            $diterima = $bruto - $pajak;
            PermohonanDanaItemNominatif::create([
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
                'pph21_persen' => $p->pph21_persen,
                'volume' => 1,
                'harga_satuan' => $harga,
                'jumlah_bruto' => $bruto,
                'jumlah_pajak' => $pajak,
                'jumlah_diterima' => $diterima,
                'urutan' => $urutan++,
            ]);
        }

        $pd->update(['total_anggaran' => $total]);
        $this->command->info("  {$nomor} (521115) dibuat — total Rp " . number_format($total, 0, ',', '.'));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 521213 — Honor Output Kegiatan
    // ═══════════════════════════════════════════════════════════════════════
    private function seedHonor521213(
        $pegawaiAll, $timKerjaId, $createdBy, $dicairkanBy,
        $ppkApprovedBy, $katimApprovedBy, $kabagApprovedBy,
        $tahunAnggaranId, $tglMulai, $tglSelesai, $tglDicairkan, $tglNominatif, $now
    ): void {
        $nomor = '017/LL3/PerD/V/2026';
        $pd = PermohonanDana::firstOrCreate(
            ['nomor_permohonan' => $nomor],
            [
                'tahun_anggaran_id' => $tahunAnggaranId,
                'tim_kerja_id' => $timKerjaId,
                'judul_pekerjaan' => 'Workshop Peningkatan Mutu Perguruan Tinggi Wilayah III',
                'keperluan' => 'Pembayaran honorarium panitia workshop',
                'tanggal_mulai' => $tglMulai,
                'tanggal_selesai' => $tglSelesai,
                'tempat' => 'Hotel Grand Sahid, Jakarta',
                'no_sk' => 'SK-521213/V/2026',
                'tgl_sk' => '2026-05-10',
                'total_anggaran' => 0,
                'status' => 'dicairkan',
                'wizard_step' => 4,
                'created_by' => $createdBy,
                'kapokja_id' => $createdBy,
                'tgl_nominatif' => $tglNominatif,
                'submitted_at' => $now,
                'katim_approved_by' => $katimApprovedBy,
                'katim_approved_at' => $now,
                'kabag_approved_by' => $kabagApprovedBy,
                'kabag_approved_at' => $now,
                'ppk_approved_by' => $ppkApprovedBy,
                'ppk_approved_at' => $now,
                'pic_approved_by' => $ppkApprovedBy,
                'pic_approved_at' => $now,
                'dicairkan_by' => $dicairkanBy,
                'dicairkan_at' => $tglDicairkan,
                'catatan_pencairan' => 'Dicairkan penuh sesuai nominatif',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        if ($pd->wasRecentlyCreated === false) {
            $this->command->info("  {$nomor} sudah ada, dilewati.");
            return;
        }

        $itemsData = [
            ['dja_id' => 210, 'jabatan' => 'Penanggung Jawab', 'harga' => 450000, 'vol' => 1, 'peserta' => [3]],     // Siti Rahma
            ['dja_id' => 211, 'jabatan' => 'Ketua',            'harga' => 400000, 'vol' => 1, 'peserta' => [4]],     // Bambang
            ['dja_id' => 212, 'jabatan' => 'Sekretaris',      'harga' => 300000, 'vol' => 1, 'peserta' => [5]],     // Agus Priyatno
            ['dja_id' => 213, 'jabatan' => 'Anggota',         'harga' => 300000, 'vol' => 3, 'peserta' => [6, 7, 8]], // Dewi, Rudi, Slamet
        ];

        $grandTotal = 0;
        foreach ($itemsData as $idx => $id) {
            $total = $id['harga'] * $id['vol'];
            $grandTotal += $total;

            $item = PermohonanDanaItem::create([
                'permohonan_dana_id' => $pd->id,
                'dja_rincian_biaya_id' => $id['dja_id'],
                'kode_akun' => '521213',
                'uraian' => "Honorarium {$id['jabatan']} Panitia Workshop",
                'volume' => $id['vol'],
                'satuan' => 'ORG',
                'harga_satuan' => $id['harga'],
                'total' => $total,
                'jumlah_permintaan' => $total,
                'urutan' => $idx + 1,
            ]);

            $urutan = 1;
            foreach ($id['peserta'] as $pid) {
                $p = $pegawaiAll[$pid] ?? null;
                if (! $p) continue;
                $bruto = $id['harga'];
                $pajak = round($bruto * ($p->pph21_persen / 100), 2);
                $diterima = $bruto - $pajak;
                PermohonanDanaItemNominatif::create([
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
                    'pph21_persen' => $p->pph21_persen,
                    'jabatan' => $id['jabatan'],
                    'volume' => 1,
                    'harga_satuan' => $id['harga'],
                    'jumlah_bruto' => $bruto,
                    'jumlah_pajak' => $pajak,
                    'jumlah_diterima' => $diterima,
                    'urutan' => $urutan++,
                ]);
            }
        }

        $pd->update(['total_anggaran' => $grandTotal]);
        $this->command->info("  {$nomor} (521213) dibuat — total Rp " . number_format($grandTotal, 0, ',', '.'));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 524111 — Perjalanan Dinas Luar Kota
    // ═══════════════════════════════════════════════════════════════════════
    private function seedPerjadin524111(
        $pegawaiAll, $timKerjaId, $createdBy, $dicairkanBy,
        $ppkApprovedBy, $katimApprovedBy, $kabagApprovedBy,
        $tahunAnggaranId, $tglMulai, $tglSelesai, $tglDicairkan, $tglNominatif, $now
    ): void {
        $nomor = '018/LL3/PerD/V/2026';
        $pd = PermohonanDana::firstOrCreate(
            ['nomor_permohonan' => $nomor],
            [
                'tahun_anggaran_id' => $tahunAnggaranId,
                'tim_kerja_id' => $timKerjaId,
                'judul_pekerjaan' => 'Monitoring dan Evaluasi PTS di Jawa Barat',
                'keperluan' => 'Perjalanan dinas monitoring PTS Bandung dan Bekasi',
                'tanggal_mulai' => $tglMulai,
                'tanggal_selesai' => $tglSelesai,
                'tempat' => 'Bandung dan Bekasi, Jawa Barat',
                'total_anggaran' => 0,
                'status' => 'dicairkan',
                'wizard_step' => 4,
                'created_by' => $createdBy,
                'kapokja_id' => $createdBy,
                'no_st' => 'ST-524111/V/2026',
                'tgl_st' => $tglMulai,
                'tgl_nominatif' => $tglNominatif,
                'submitted_at' => $now,
                'katim_approved_by' => $katimApprovedBy,
                'katim_approved_at' => $now,
                'kabag_approved_by' => $kabagApprovedBy,
                'kabag_approved_at' => $now,
                'ppk_approved_by' => $ppkApprovedBy,
                'ppk_approved_at' => $now,
                'pic_approved_by' => $ppkApprovedBy,
                'pic_approved_at' => $now,
                'dicairkan_by' => $dicairkanBy,
                'dicairkan_at' => $tglDicairkan,
                'catatan_pencairan' => 'Dicairkan penuh sesuai nominatif',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        if ($pd->wasRecentlyCreated === false) {
            $this->command->info("  {$nomor} sudah ada, dilewati.");
            return;
        }

        // 2 item: Uang Harian (dja_id=204) & Transport (dja_id=205)
        $itemsData = [
            [
                'dja_id' => 204,
                'uraian' => 'Uang Harian Perjalanan Dinas Luar Kota (Jawa Barat)',
                'harga' => 430000,
                'vol' => 3,
                'komponen' => 'uang_harian',
            ],
            [
                'dja_id' => 205,
                'uraian' => 'Satuan Biaya Transportasi Jakarta ke Kota Bekasi',
                'harga' => 200000,
                'vol' => 3,
                'komponen' => 'transport',
            ],
        ];

        $pesertaIds = [3, 5, 6]; // Siti Rahma, Agus Priyatno, Dewi Kusumawati
        $grandTotal = 0;

        foreach ($itemsData as $idx => $id) {
            $total = $id['harga'] * $id['vol'];
            $grandTotal += $total;

            $item = PermohonanDanaItem::create([
                'permohonan_dana_id' => $pd->id,
                'dja_rincian_biaya_id' => $id['dja_id'],
                'kode_akun' => '524111',
                'uraian' => $id['uraian'],
                'volume' => $id['vol'],
                'satuan' => 'ORG',
                'harga_satuan' => $id['harga'],
                'total' => $total,
                'jumlah_permintaan' => $total,
                'urutan' => $idx + 1,
            ]);

            $urutan = 1;
            foreach ($pesertaIds as $pid) {
                $p = $pegawaiAll[$pid] ?? null;
                if (! $p) continue;

                $data = [
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
                    'pph21_persen' => 0,
                    'urutan' => $urutan++,
                ];

                if ($id['komponen'] === 'uang_harian') {
                    $data['uang_harian_vol'] = 1;
                    $data['uang_harian_satuan'] = $id['harga'];
                    $data['uang_harian_jumlah'] = $id['harga'];
                    $data['jumlah_perjadin'] = $id['harga'];
                } else {
                    $data['transport'] = $id['harga'];
                    $data['jumlah_perjadin'] = $id['harga'];
                }

                PermohonanDanaItemNominatif::create($data);
            }
        }

        $pd->update(['total_anggaran' => $grandTotal]);
        $this->command->info("  {$nomor} (524111) dibuat — total Rp " . number_format($grandTotal, 0, ',', '.'));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 524119 — Perjalanan Dinas Paket Meeting (tidak ada di DJA)
    // ═══════════════════════════════════════════════════════════════════════
    private function seedPerjadin524119(
        $pegawaiAll, $timKerjaId, $createdBy, $dicairkanBy,
        $ppkApprovedBy, $katimApprovedBy, $kabagApprovedBy,
        $tahunAnggaranId, $tglMulai, $tglSelesai, $tglDicairkan, $tglNominatif, $now
    ): void {
        $nomor = '019/LL3/PerD/V/2026';
        $pd = PermohonanDana::firstOrCreate(
            ['nomor_permohonan' => $nomor],
            [
                'tahun_anggaran_id' => $tahunAnggaranId,
                'tim_kerja_id' => $timKerjaId,
                'judul_pekerjaan' => 'Rapat Koordinasi Paket Meeting di Yogyakarta',
                'keperluan' => 'Perjalanan dinas paket meeting koordinasi perguruan tinggi',
                'tanggal_mulai' => $tglMulai,
                'tanggal_selesai' => $tglSelesai,
                'tempat' => 'Yogyakarta',
                'total_anggaran' => 0,
                'status' => 'dicairkan',
                'wizard_step' => 4,
                'created_by' => $createdBy,
                'kapokja_id' => $createdBy,
                'no_st' => 'ST-524119/V/2026',
                'tgl_st' => $tglMulai,
                'tgl_nominatif' => $tglNominatif,
                'submitted_at' => $now,
                'katim_approved_by' => $katimApprovedBy,
                'katim_approved_at' => $now,
                'kabag_approved_by' => $kabagApprovedBy,
                'kabag_approved_at' => $now,
                'ppk_approved_by' => $ppkApprovedBy,
                'ppk_approved_at' => $now,
                'pic_approved_by' => $ppkApprovedBy,
                'pic_approved_at' => $now,
                'dicairkan_by' => $dicairkanBy,
                'dicairkan_at' => $tglDicairkan,
                'catatan_pencairan' => 'Dicairkan penuh sesuai nominatif',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        if ($pd->wasRecentlyCreated === false) {
            $this->command->info("  {$nomor} sudah ada, dilewati.");
            return;
        }

        $harga = 4149000; // total per orang (harian + transport + taksi + tiket + hotel)
        $volume = 3;
        $total = $harga * $volume;

        $item = PermohonanDanaItem::create([
            'permohonan_dana_id' => $pd->id,
            'dja_rincian_biaya_id' => null,
            'kode_akun' => '524119',
            'uraian' => 'Biaya Perjalanan Dinas Paket Meeting Luar Kota',
            'volume' => $volume,
            'satuan' => 'ORG',
            'harga_satuan' => $harga,
            'total' => $total,
            'jumlah_permintaan' => $total,
            'urutan' => 1,
        ]);

        $pesertaIds = [4, 7, 8]; // Bambang, Rudi, Slamet
        $urutan = 1;
        foreach ($pesertaIds as $pid) {
            $p = $pegawaiAll[$pid] ?? null;
            if (! $p) continue;

            PermohonanDanaItemNominatif::create([
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
                'pph21_persen' => 0,
                'uang_harian_vol' => 2,
                'uang_harian_satuan' => 430000,
                'uang_harian_jumlah' => 860000,
                'transport' => 284000,
                'taksi_pp' => 200000,
                'tiket_pesawat' => 2500000,
                'hotel' => 305000,
                'jumlah_perjadin' => $harga,
                'urutan' => $urutan++,
            ]);
        }

        $pd->update(['total_anggaran' => $total]);
        $this->command->info("  {$nomor} (524119) dibuat — total Rp " . number_format($total, 0, ',', '.'));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 524114 — Perjalanan Dinas Dalam Kota (tidak ada di DJA)
    // ═══════════════════════════════════════════════════════════════════════
    private function seedPerjadin524114(
        $pegawaiAll, $timKerjaId, $createdBy, $dicairkanBy,
        $ppkApprovedBy, $katimApprovedBy, $kabagApprovedBy,
        $tahunAnggaranId, $tglMulai, $tglSelesai, $tglDicairkan, $tglNominatif, $now
    ): void {
        $nomor = '020/LL3/PerD/V/2026';
        $pd = PermohonanDana::firstOrCreate(
            ['nomor_permohonan' => $nomor],
            [
                'tahun_anggaran_id' => $tahunAnggaranId,
                'tim_kerja_id' => $timKerjaId,
                'judul_pekerjaan' => 'Koordinasi Internal Tim Kerja di Jakarta',
                'keperluan' => 'Perjalanan dinas dalam kota koordinasi antar tim kerja',
                'tanggal_mulai' => $tglMulai,
                'tanggal_selesai' => $tglSelesai,
                'tempat' => 'Jakarta',
                'total_anggaran' => 0,
                'status' => 'dicairkan',
                'wizard_step' => 4,
                'created_by' => $createdBy,
                'kapokja_id' => $createdBy,
                'no_st' => 'ST-524114/V/2026',
                'tgl_st' => $tglMulai,
                'tgl_nominatif' => $tglNominatif,
                'submitted_at' => $now,
                'katim_approved_by' => $katimApprovedBy,
                'katim_approved_at' => $now,
                'kabag_approved_by' => $kabagApprovedBy,
                'kabag_approved_at' => $now,
                'ppk_approved_by' => $ppkApprovedBy,
                'ppk_approved_at' => $now,
                'pic_approved_by' => $ppkApprovedBy,
                'pic_approved_at' => $now,
                'dicairkan_by' => $dicairkanBy,
                'dicairkan_at' => $tglDicairkan,
                'catatan_pencairan' => 'Dicairkan penuh sesuai nominatif',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        if ($pd->wasRecentlyCreated === false) {
            $this->command->info("  {$nomor} sudah ada, dilewati.");
            return;
        }

        $harga = 380000; // 210.000 uang harian + 170.000 transport
        $volume = 3;
        $total = $harga * $volume;

        $item = PermohonanDanaItem::create([
            'permohonan_dana_id' => $pd->id,
            'dja_rincian_biaya_id' => null,
            'kode_akun' => '524114',
            'uraian' => 'Biaya Perjalanan Dinas Dalam Kota',
            'volume' => $volume,
            'satuan' => 'ORG',
            'harga_satuan' => $harga,
            'total' => $total,
            'jumlah_permintaan' => $total,
            'urutan' => 1,
        ]);

        $pesertaIds = [9, 10, 11]; // Nur Aini, Irwan Kusuma, Rina Fitriani
        $urutan = 1;
        foreach ($pesertaIds as $pid) {
            $p = $pegawaiAll[$pid] ?? null;
            if (! $p) continue;

            PermohonanDanaItemNominatif::create([
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
                'pph21_persen' => 0,
                'uang_harian_vol' => 1,
                'uang_harian_satuan' => 210000,
                'uang_harian_jumlah' => 210000,
                'transport' => 170000,
                'jumlah_perjadin' => $harga,
                'urutan' => $urutan++,
            ]);
        }

        $pd->update(['total_anggaran' => $total]);
        $this->command->info("  {$nomor} (524114) dibuat — total Rp " . number_format($total, 0, ',', '.'));
    }
}
