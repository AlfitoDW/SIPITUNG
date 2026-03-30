<?php

namespace Database\Seeders;

use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Illuminate\Database\Seeder;

class KeuanganSeeder extends Seeder
{
    public function run(): void
    {
        // ── Validasi dependensi ───────────────────────────────────────────────────
        $tahun      = TahunAnggaran::where('is_default', true)->first();
        $kabagUmum  = User::where('username', 'kabagumum')->first();
        $ppk        = User::where('username', 'ppk')->first();
        $bendahara  = User::where('username', 'bendahara')->first();

        if (! $tahun || ! $kabagUmum || ! $ppk || ! $bendahara) {
            $this->command->warn('KeuanganSeeder: pastikan TahunAnggaranSeeder dan UserSeeder sudah dijalankan.');
            return;
        }

        // ── Tandai TK-PKU sebagai koordinator keuangan ────────────────────────────
        TimKerja::where('kode', 'TK-PKU')->update(['is_koordinator' => true]);
        $this->command->info('TK-PKU ditandai sebagai koordinator keuangan.');

        // ── Data skenario: satu permohonan per tim, mencakup semua status ─────────
        $skenario = $this->getSkenario($tahun->tahun);

        foreach ($skenario as $idx => $data) {
            $tim   = TimKerja::where('kode', $data['tim_kode'])->first();
            $ketua = User::where('username', $data['ketua_username'])->first();

            if (! $tim || ! $ketua) {
                $this->command->warn("KeuanganSeeder: Tim {$data['tim_kode']} atau ketua tidak ditemukan, dilewati.");
                continue;
            }

            $nomor = 'PD/' . $tahun->tahun . '/' . str_pad($idx + 1, 3, '0', STR_PAD_LEFT);

            $pd = PermohonanDana::updateOrCreate(
                ['nomor_permohonan' => $nomor],
                $this->buildHeader($data, $tahun->id, $tim->id, $ketua->id, $nomor, $kabagUmum, $bendahara, $ppk)
            );

            // Bersihkan items lama lalu insert ulang
            $pd->items()->delete();
            foreach ($data['items'] as $urutan => $item) {
                $pd->items()->create([
                    'uraian'       => $item['uraian'],
                    'volume'       => $item['volume'],
                    'satuan'       => $item['satuan'],
                    'harga_satuan' => $item['harga_satuan'],
                    'total'        => $item['volume'] * $item['harga_satuan'],
                    'keterangan'   => $item['keterangan'] ?? null,
                    'urutan'       => $urutan + 1,
                ]);
            }

            // Recalculate & save total
            $total = collect($data['items'])->sum(fn ($i) => $i['volume'] * $i['harga_satuan']);
            $pd->update(['total_anggaran' => $total]);

            $this->command->info("✓ [{$data['status']}] {$nomor} — {$tim->kode}");
        }
    }

    // ─── Builder: isi field approval sesuai status ────────────────────────────────

    private function buildHeader(array $data, int $tahunId, int $timId, int $ketuaId, string $nomor, User $kabag, User $bendahara, User $ppk): array
    {
        $base = [
            'tahun_anggaran_id' => $tahunId,
            'tim_kerja_id'      => $timId,
            'keperluan'         => $data['keperluan'],
            'tanggal_kegiatan'  => $data['tanggal_kegiatan'],
            'keterangan'        => $data['keterangan'] ?? null,
            'total_anggaran'    => 0, // dihitung ulang setelah items
            'status'            => $data['status'],
            'created_by'        => $ketuaId,
            // Reset semua approval field dulu
            'kabag_approved_by'    => null, 'rekomendasi_kabag'    => null,
            'bendahara_checked_by' => null, 'catatan_bendahara'    => null,
            'katimku_approved_by'  => null, 'rekomendasi_katimku'  => null,
            'ppk_approved_by'      => null, 'rekomendasi_ppk'      => null,
            'dicairkan_by'         => null, 'catatan_pencairan'    => null,
            'dicairkan_at'         => null, 'rejected_by'          => null,
        ];

        return match ($data['status']) {
            'submitted' => $base,

            'kabag_approved' => array_merge($base, [
                'kabag_approved_by' => $kabag->id,
                'rekomendasi_kabag' => 'Disetujui. Mohon dilanjutkan proses verifikasi ke bendahara.',
            ]),

            'bendahara_checked' => array_merge($base, [
                'kabag_approved_by'    => $kabag->id,
                'rekomendasi_kabag'    => 'Disetujui sesuai kebutuhan kegiatan.',
                'bendahara_checked_by' => $bendahara->id,
                'catatan_bendahara'    => 'Anggaran tersedia. Rincian item sesuai standar biaya.',
            ]),

            'katimku_approved' => array_merge($base, [
                'kabag_approved_by'    => $kabag->id,
                'rekomendasi_kabag'    => 'Disetujui.',
                'bendahara_checked_by' => $bendahara->id,
                'catatan_bendahara'    => 'Telah diverifikasi, anggaran mencukupi.',
                'katimku_approved_by'  => $ketuaId, // placeholder, idealnya ketua PKU
                'rekomendasi_katimku'  => 'Kegiatan sesuai rencana aksi. Dapat dilanjutkan ke PPK.',
            ]),

            'ppk_approved' => array_merge($base, [
                'kabag_approved_by'    => $kabag->id,
                'rekomendasi_kabag'    => 'Disetujui.',
                'bendahara_checked_by' => $bendahara->id,
                'catatan_bendahara'    => 'Verifikasi selesai.',
                'katimku_approved_by'  => $ketuaId,
                'rekomendasi_katimku'  => 'Sesuai perencanaan.',
                'ppk_approved_by'      => $ppk->id,
                'rekomendasi_ppk'      => 'Disetujui untuk dicairkan.',
            ]),

            'dicairkan' => array_merge($base, [
                'kabag_approved_by'    => $kabag->id,
                'rekomendasi_kabag'    => 'Disetujui.',
                'bendahara_checked_by' => $bendahara->id,
                'catatan_bendahara'    => 'Verifikasi selesai.',
                'katimku_approved_by'  => $ketuaId,
                'rekomendasi_katimku'  => 'Sesuai perencanaan.',
                'ppk_approved_by'      => $ppk->id,
                'rekomendasi_ppk'      => 'Disetujui.',
                'dicairkan_by'         => $bendahara->id,
                'catatan_pencairan'    => 'Dana telah dicairkan melalui transfer ke rekening bendahara pengeluaran.',
                'dicairkan_at'         => now()->subDays(3),
            ]),

            'rejected' => array_merge($base, [
                'kabag_approved_by' => $kabag->id,
                'rekomendasi_kabag' => $data['catatan_tolak'] ?? 'Rincian anggaran perlu direvisi. Harga satuan melebihi SBM.',
                'rejected_by'       => 'kabag_umum',
            ]),

            default => $base, // draft
        };
    }

    // ─── Data skenario (8 tim, 8 status berbeda) ──────────────────────────────────

    private function getSkenario(int $tahun): array
    {
        return [
            // 1. TK-PKU — draft (ketua koordinator pun punya permohonan sendiri)
            [
                'tim_kode'        => 'TK-PKU',
                'ketua_username'  => 'ketua.pku',
                'status'          => 'draft',
                'keperluan'       => 'Rapat Koordinasi Penyusunan Laporan Keuangan Semester I',
                'tanggal_kegiatan'=> "{$tahun}-03-15",
                'keterangan'      => 'Rapat internal tim untuk finalisasi laporan keuangan sebelum diserahkan ke pimpinan.',
                'items'           => [
                    ['uraian' => 'Konsumsi peserta rapat (snack + makan siang)', 'volume' => 20, 'satuan' => 'orang', 'harga_satuan' => 75000],
                    ['uraian' => 'Fotokopi bahan rapat',                          'volume' => 20, 'satuan' => 'rangkap','harga_satuan' => 15000],
                    ['uraian' => 'Alat tulis (bolpoin, kertas HVS)',              'volume' => 1,  'satuan' => 'paket',  'harga_satuan' => 120000],
                ],
            ],

            // 2. TK-HKL — submitted (menunggu kabag)
            [
                'tim_kode'        => 'TK-HKL',
                'ketua_username'  => 'ketua.hkl',
                'status'          => 'submitted',
                'keperluan'       => 'Sosialisasi Peraturan Kepegawaian Terbaru kepada Seluruh ASN',
                'tanggal_kegiatan'=> "{$tahun}-04-10",
                'keterangan'      => 'Kegiatan sosialisasi wajib terkait PP Nomor 94 Tahun 2021 tentang Disiplin PNS.',
                'items'           => [
                    ['uraian' => 'Honorarium narasumber internal',                 'volume' => 2,  'satuan' => 'orang/jam', 'harga_satuan' => 900000],
                    ['uraian' => 'Konsumsi peserta (snack + makan siang)',         'volume' => 45, 'satuan' => 'orang',     'harga_satuan' => 80000],
                    ['uraian' => 'Sewa LCD proyektor',                            'volume' => 1,  'satuan' => 'unit/hari', 'harga_satuan' => 350000],
                    ['uraian' => 'Penggandaan materi sosialisasi',                 'volume' => 45, 'satuan' => 'rangkap',  'harga_satuan' => 20000],
                    ['uraian' => 'Spanduk kegiatan (3 × 1 m)',                    'volume' => 1,  'satuan' => 'buah',      'harga_satuan' => 250000],
                ],
            ],

            // 3. TK-TBN — kabag_approved (menunggu verifikasi bendahara)
            [
                'tim_kode'        => 'TK-TBN',
                'ketua_username'  => 'ketua.tbn',
                'status'          => 'kabag_approved',
                'keperluan'       => 'Pengadaan Alat Tulis Kantor dan Perlengkapan Administrasi Triwulan I',
                'tanggal_kegiatan'=> "{$tahun}-02-28",
                'keterangan'      => 'Pengadaan ATK rutin untuk operasional seluruh tim kerja.',
                'items'           => [
                    ['uraian' => 'Kertas HVS A4 80 gsm',          'volume' => 10, 'satuan' => 'rim',   'harga_satuan' => 58000],
                    ['uraian' => 'Tinta printer (hitam)',          'volume' => 4,  'satuan' => 'botol', 'harga_satuan' => 95000],
                    ['uraian' => 'Tinta printer (warna)',          'volume' => 4,  'satuan' => 'botol', 'harga_satuan' => 120000],
                    ['uraian' => 'Spidol whiteboard (set)',        'volume' => 5,  'satuan' => 'set',   'harga_satuan' => 45000],
                    ['uraian' => 'Map plastik transparent',        'volume' => 50, 'satuan' => 'buah',  'harga_satuan' => 5000],
                    ['uraian' => 'Staples besar + isi',           'volume' => 3,  'satuan' => 'buah',  'harga_satuan' => 35000],
                    ['uraian' => 'Amplop coklat folio (pack)',     'volume' => 5,  'satuan' => 'pack',  'harga_satuan' => 28000],
                ],
            ],

            // 4. TK-HKS — bendahara_checked (menunggu ketua tim PKU)
            [
                'tim_kode'        => 'TK-HKS',
                'ketua_username'  => 'ketua.hks',
                'status'          => 'bendahara_checked',
                'keperluan'       => 'Publikasi Kegiatan LLDIKTI Wilayah III di Media Massa',
                'tanggal_kegiatan'=> "{$tahun}-04-20",
                'keterangan'      => 'Liputan dan publikasi kegiatan Dies Natalis LLDIKTI Wilayah III di media online dan cetak.',
                'items'           => [
                    ['uraian' => 'Pemasangan iklan di media online (1 minggu)', 'volume' => 2, 'satuan' => 'media',  'harga_satuan' => 2500000],
                    ['uraian' => 'Jasa fotografer profesional',                 'volume' => 1, 'satuan' => 'orang',  'harga_satuan' => 1500000],
                    ['uraian' => 'Jasa videografer + editing',                  'volume' => 1, 'satuan' => 'paket',  'harga_satuan' => 3000000],
                    ['uraian' => 'Cetak baliho 3×4 m',                         'volume' => 2, 'satuan' => 'buah',   'harga_satuan' => 850000],
                    ['uraian' => 'Siaran pers / press release',                 'volume' => 3, 'satuan' => 'media',  'harga_satuan' => 750000],
                ],
            ],

            // 5. TK-KKM — katimku_approved (menunggu PPK)
            [
                'tim_kode'        => 'TK-KKM',
                'ketua_username'  => 'ketua.kkm',
                'status'          => 'katimku_approved',
                'keperluan'       => 'Workshop Akreditasi Program Studi bagi Operator PTS Wilayah III',
                'tanggal_kegiatan'=> "{$tahun}-05-08",
                'keterangan'      => 'Pelatihan teknis pengisian instrumen akreditasi BAN-PT untuk operator 30 PTS.',
                'items'           => [
                    ['uraian' => 'Honorarium narasumber (pakar akreditasi)',    'volume' => 2,  'satuan' => 'orang/hari', 'harga_satuan' => 1500000],
                    ['uraian' => 'Konsumsi peserta (3 waktu × 30 orang)',      'volume' => 90, 'satuan' => 'porsi',      'harga_satuan' => 45000],
                    ['uraian' => 'Sewa ruang pertemuan kapasitas 50 orang',    'volume' => 1,  'satuan' => 'hari',       'harga_satuan' => 2500000],
                    ['uraian' => 'Modul pelatihan (cetak + jilid)',            'volume' => 35, 'satuan' => 'buah',       'harga_satuan' => 75000],
                    ['uraian' => 'Perlengkapan peserta (tas + ATK)',           'volume' => 30, 'satuan' => 'set',        'harga_satuan' => 85000],
                    ['uraian' => 'Sertifikat peserta + bingkai',              'volume' => 30, 'satuan' => 'buah',       'harga_satuan' => 35000],
                ],
            ],

            // 6. TK-PMU — ppk_approved (siap dicairkan bendahara)
            [
                'tim_kode'        => 'TK-PMU',
                'ketua_username'  => 'ketua.pmu',
                'status'          => 'ppk_approved',
                'keperluan'       => 'Monitoring dan Evaluasi Implementasi SPMI di PTS Binaan',
                'tanggal_kegiatan'=> "{$tahun}-04-25",
                'keterangan'      => 'Kunjungan lapangan ke 5 PTS untuk monitoring implementasi SPMI semester genap.',
                'items'           => [
                    ['uraian' => 'Uang harian perjalanan dinas dalam kota (5 hari × 4 orang)', 'volume' => 20, 'satuan' => 'OH',    'harga_satuan' => 150000],
                    ['uraian' => 'Transport lokal (BBM)',                                       'volume' => 5,  'satuan' => 'hari',  'harga_satuan' => 200000],
                    ['uraian' => 'Biaya tol dan parkir',                                       'volume' => 5,  'satuan' => 'hari',  'harga_satuan' => 75000],
                    ['uraian' => 'Konsumsi tim (makan siang + snack)',                         'volume' => 20, 'satuan' => 'orang', 'harga_satuan' => 70000],
                    ['uraian' => 'Penggandaan instrumen monev',                               'volume' => 25, 'satuan' => 'rangkap','harga_satuan' => 25000],
                ],
            ],

            // 7. TK-SDY — dicairkan (selesai)
            [
                'tim_kode'        => 'TK-SDY',
                'ketua_username'  => 'ketua.sdy',
                'status'          => 'dicairkan',
                'keperluan'       => 'Pelatihan Pengembangan Kompetensi ASN Bidang IT',
                'tanggal_kegiatan'=> "{$tahun}-02-15",
                'keterangan'      => 'Kegiatan pelatihan sudah terlaksana. Dana telah dicairkan.',
                'items'           => [
                    ['uraian' => 'Biaya registrasi pelatihan (per orang)',  'volume' => 5,  'satuan' => 'orang', 'harga_satuan' => 1200000],
                    ['uraian' => 'Uang harian (3 hari × 5 orang)',         'volume' => 15, 'satuan' => 'OH',    'harga_satuan' => 530000],
                    ['uraian' => 'Transport ke lokasi pelatihan (PP)',      'volume' => 5,  'satuan' => 'orang', 'harga_satuan' => 250000],
                    ['uraian' => 'Penginapan (2 malam × 5 orang)',         'volume' => 10, 'satuan' => 'malam', 'harga_satuan' => 450000],
                ],
            ],

            // 8. TK-PKP — rejected (ditolak kabag, perlu revisi)
            [
                'tim_kode'        => 'TK-PKP',
                'ketua_username'  => 'ketua.pkp',
                'status'          => 'rejected',
                'keperluan'       => 'Pengadaan Laptop untuk Kebutuhan Operasional Tim',
                'tanggal_kegiatan'=> "{$tahun}-03-01",
                'keterangan'      => 'Pengadaan 3 unit laptop untuk mendukung pekerjaan tim yang mobile.',
                'catatan_tolak'   => 'Pengadaan barang modal tidak dapat diproses melalui mekanisme permohonan dana. Mohon diajukan melalui SIMAK BMN.',
                'items'           => [
                    ['uraian' => 'Laptop core i7, RAM 16GB, SSD 512GB', 'volume' => 3, 'satuan' => 'unit', 'harga_satuan' => 15000000],
                    ['uraian' => 'Mouse wireless',                       'volume' => 3, 'satuan' => 'buah', 'harga_satuan' => 150000],
                    ['uraian' => 'Tas laptop',                          'volume' => 3, 'satuan' => 'buah', 'harga_satuan' => 250000],
                ],
            ],
        ];
    }
}
