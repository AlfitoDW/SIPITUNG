<?php

namespace Database\Seeders;

use App\Models\IndikatorKinerja;
use App\Models\LaporanPengukuran;
use App\Models\MasterSasaran;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\RealisasiKinerja;
use App\Models\RencanaAksi;
use App\Models\RencanaAksiIndikator;
use App\Models\Sasaran;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Illuminate\Database\Seeder;

class PerencanaanSeeder extends Seeder
{
    public function run(): void
    {
        $tahun = TahunAnggaran::where('is_default', true)->first();

        if (! $tahun) {
            $this->command->warn('PerencanaanSeeder: TahunAnggaranSeeder belum dijalankan.');
            return;
        }

        // Seed periode pengukuran (TW1–TW4, TW1 aktif sebagai default)
        foreach (['TW1' => true, 'TW2' => false, 'TW3' => false, 'TW4' => false] as $tw => $aktif) {
            PeriodePengukuran::updateOrCreate(
                ['tahun_anggaran_id' => $tahun->id, 'triwulan' => $tw],
                ['is_active' => $aktif]
            );
        }

        $sasaranNamas = $this->getSasaranNamas();
        $ikuMaster    = $this->getIkuMaster();
        $twMaster     = $this->getTwMaster();
        $picPrimerMap = $this->getPicPrimerMap();
        $coPicMap     = $this->getCoPicMap();

        // Seed master sasaran
        foreach ($sasaranNamas as $kode => $nama) {
            MasterSasaran::updateOrCreate(
                ['tahun_anggaran_id' => $tahun->id, 'kode' => $kode],
                [
                    'nama'   => $nama,
                    'urutan' => (int) str_replace('S ', '', $kode),
                ]
            );
        }

        // ── PK Awal & Revisi: SATU PK milik TK-PK, berisi SEMUA IKU ────────────
        $tkPk  = TimKerja::where('kode', 'TK-PK')->firstOrFail();
        $ketua = User::where('tim_kerja_id', $tkPk->id)->where('role', 'ketua_tim_kerja')->first();
        $createdBy = $ketua?->id ?? 1;

        $pkAwal = PerjanjianKinerja::updateOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $tkPk->id, 'jenis' => 'awal'],
            ['status' => 'draft', 'created_by' => $createdBy]
        );

        // Mapping sasaran → IKU untuk PK (semua IKU, diurutkan kode sasaran → kode IKU)
        $pkIkuMap = $this->getPkIkuMap();
        $ikuRecords = []; // kode_iku => IndikatorKinerja (dari PK Awal)

        foreach ($pkIkuMap as $sasKode => $ikuKodes) {
            $sasaran = Sasaran::updateOrCreate(
                ['perjanjian_kinerja_id' => $pkAwal->id, 'kode' => $sasKode],
                ['nama' => $sasaranNamas[$sasKode], 'urutan' => (int) str_replace('S ', '', $sasKode)]
            );

            foreach ($ikuKodes as $urutan => $ikuKode) {
                $ikuData      = $ikuMaster[$ikuKode];
                $tw           = $twMaster[$ikuKode] ?? ['tw1' => null, 'tw2' => null, 'tw3' => null, 'tw4' => null];
                $picPrimer    = TimKerja::where('kode', $picPrimerMap[$ikuKode])->first();

                $iku = IndikatorKinerja::updateOrCreate(
                    ['sasaran_id' => $sasaran->id, 'kode' => $ikuKode],
                    [
                        'nama'             => $ikuData['nama'],
                        'satuan'           => $ikuData['satuan'],
                        'target'           => $ikuData['target'],
                        'target_tw1'       => $tw['tw1'],
                        'target_tw2'       => $tw['tw2'],
                        'target_tw3'       => $tw['tw3'],
                        'target_tw4'       => $tw['tw4'],
                        'urutan'           => $urutan + 1,
                        'pic_tim_kerja_id' => $picPrimer?->id,
                    ]
                );

                // Primary PIC di pivot
                if ($picPrimer) {
                    $iku->picTimKerjas()->syncWithoutDetaching([$picPrimer->id]);
                }
                // Co-PICs di pivot
                foreach ($coPicMap[$ikuKode] ?? [] as $coPicKode) {
                    $coPic = TimKerja::where('kode', $coPicKode)->first();
                    if ($coPic) {
                        $iku->picTimKerjas()->syncWithoutDetaching([$coPic->id]);
                    }
                }

                $ikuRecords[$ikuKode] = $iku;
            }
        }

        // PK Revisi: copy langsung dari PK Awal
        $pkRevisi            = PerjanjianKinerja::updateOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $tkPk->id, 'jenis' => 'revisi'],
            ['status' => 'draft', 'created_by' => $createdBy]
        );
        $pkAwalSasaransLoaded = Sasaran::where('perjanjian_kinerja_id', $pkAwal->id)
            ->with(['indikators.picTimKerjas'])
            ->get();

        foreach ($pkAwalSasaransLoaded as $sasAwal) {
            $sasRevisi = Sasaran::updateOrCreate(
                ['perjanjian_kinerja_id' => $pkRevisi->id, 'kode' => $sasAwal->kode],
                ['nama' => $sasAwal->nama, 'urutan' => $sasAwal->urutan]
            );
            foreach ($sasAwal->indikators as $ikuAwal) {
                $ikuRevisi = IndikatorKinerja::updateOrCreate(
                    ['sasaran_id' => $sasRevisi->id, 'kode' => $ikuAwal->kode],
                    [
                        'nama'             => $ikuAwal->nama,
                        'satuan'           => $ikuAwal->satuan,
                        'target'           => $ikuAwal->target,
                        'target_tw1'       => $ikuAwal->target_tw1,
                        'target_tw2'       => $ikuAwal->target_tw2,
                        'target_tw3'       => $ikuAwal->target_tw3,
                        'target_tw4'       => $ikuAwal->target_tw4,
                        'urutan'           => $ikuAwal->urutan,
                        'pic_tim_kerja_id' => $ikuAwal->pic_tim_kerja_id,
                    ]
                );
                $ikuRevisi->picTimKerjas()->syncWithoutDetaching(
                    $ikuAwal->picTimKerjas->pluck('id')->all()
                );
            }
        }

        // ── Rencana Aksi: tetap per tim berdasarkan pic_tim_kerjas ──────────────
        // Ambil sasaran_id dari PK Awal TK-PK (sumber tunggal)
        $pkAwalSasarans = Sasaran::where('perjanjian_kinerja_id', $pkAwal->id)
            ->pluck('id', 'kode'); // ['S 1' => id, ...]

        $raIkuMap = $this->getRaIkuMap();

        foreach ($raIkuMap as $tkKode => $sasaranMap) {
            $timKerja  = TimKerja::where('kode', $tkKode)->first();
            if (! $timKerja) continue;

            $ketua2    = User::where('tim_kerja_id', $timKerja->id)->where('role', 'ketua_tim_kerja')->first();
            $createdBy2 = $ketua2?->id ?? 1;

            $ra = RencanaAksi::updateOrCreate(
                ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $timKerja->id],
                ['status' => 'draft', 'created_by' => $createdBy2]
            );

            $raUrutan = 1;
            foreach ($sasaranMap as $sasKode => $ikuKodes) {
                $sasaranId = $pkAwalSasarans->get($sasKode);
                foreach ($ikuKodes as $ikuKode) {
                    $ikuData = $ikuMaster[$ikuKode];
                    $tw      = $twMaster[$ikuKode] ?? ['tw1' => null, 'tw2' => null, 'tw3' => null, 'tw4' => null];

                    RencanaAksiIndikator::updateOrCreate(
                        ['rencana_aksi_id' => $ra->id, 'kode' => $ikuKode],
                        [
                            'sasaran_id' => $sasaranId,
                            'nama'       => $ikuData['nama'],
                            'satuan'     => $ikuData['satuan'],
                            'target'     => $ikuData['target'],
                            'target_tw1' => $tw['tw1'],
                            'target_tw2' => $tw['tw2'],
                            'target_tw3' => $tw['tw3'],
                            'target_tw4' => $tw['tw4'],
                            'urutan'     => $raUrutan++,
                        ]
                    );
                }
            }
        }

        // ── Seed RealisasiKinerja TW1 ────────────────────────────────────────────
        $periodeTw1 = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->where('triwulan', 'TW1')
            ->first();

        if ($periodeTw1) {
            $realisasiMaster = $this->getRealisasiTw1Master();

            // Realisasi diinput oleh tim kerja PIC primer masing-masing IKU
            foreach ($ikuRecords as $ikuKode => $iku) {
                $data = $realisasiMaster[$ikuKode] ?? null;
                if (! $data) continue;

                $picPrimerKode = $picPrimerMap[$ikuKode];
                $timKerjaPic   = TimKerja::where('kode', $picPrimerKode)->first();
                $ketuaPic      = $timKerjaPic
                    ? User::where('tim_kerja_id', $timKerjaPic->id)->where('role', 'ketua_tim_kerja')->first()
                    : null;

                RealisasiKinerja::updateOrCreate(
                    [
                        'indikator_kinerja_id'  => $iku->id,
                        'periode_pengukuran_id' => $periodeTw1->id,
                    ],
                    [
                        'input_by_tim_kerja_id'  => $timKerjaPic?->id,
                        'realisasi'              => $data['realisasi'],
                        'progress_kegiatan'      => $data['progress_kegiatan'],
                        'kendala'                => $data['kendala'],
                        'strategi_tindak_lanjut' => $data['strategi_tindak_lanjut'],
                        'catatan'                => null,
                        'created_by'             => $ketuaPic?->id ?? 1,
                    ]
                );
            }

            // ── Seed LaporanPengukuran TW1 (variasi status agar dashboard informatif) ──
            $laporanData = [
                // kode_tim          => status
                'TK-PK'      => 'kabag_approved',
                'TK-HKT'     => 'submitted',
                'TK-TUBMN'   => 'submitted',
                'TK-HMK'     => 'draft',
                'TK-KK'      => 'kabag_approved',
                'TK-PENJAMU' => 'rejected',
                'TK-ADIA'    => 'draft',
                'TK-SD'      => 'draft',
                'TK-BELMAWA' => 'draft',
                'TK-SIPD'    => 'draft',
                'TK-RPM'     => 'draft',
            ];

            foreach ($laporanData as $kode => $status) {
                $tim   = TimKerja::where('kode', $kode)->first();
                $ketua = $tim
                    ? User::where('tim_kerja_id', $tim->id)->where('role', 'ketua_tim_kerja')->first()
                    : null;

                if (! $tim) continue;

                LaporanPengukuran::updateOrCreate(
                    [
                        'tim_kerja_id'          => $tim->id,
                        'periode_pengukuran_id'  => $periodeTw1->id,
                    ],
                    [
                        'status'       => $status,
                        'submitted_at' => in_array($status, ['submitted', 'kabag_approved', 'rejected'])
                            ? now()->subDays(rand(3, 14))
                            : null,
                        'submitted_by' => in_array($status, ['submitted', 'kabag_approved', 'rejected'])
                            ? ($ketua?->id ?? 1)
                            : null,
                        'approved_at'  => $status === 'kabag_approved' ? now()->subDays(rand(1, 5)) : null,
                        'created_by'   => $ketua?->id ?? 1,
                    ]
                );
            }
        }
    }

    // ─── Data Masters ─────────────────────────────────────────────────────────

    private function getSasaranNamas(): array
    {
        return [
            'S 1' => 'Meningkatnya kualitas layanan Lembaga Layanan Pendidikan Tinggi (LLDIKTI)',
            'S 2' => 'Meningkatnya efektivitas sosialisasi kebijakan pendidikan tinggi',
            'S 3' => 'Meningkatnya inovasi perguruan tinggi dalam rangka meningkatkan mutu pendidikan',
            'S 4' => 'Meningkatnya tata kelola Lembaga Layanan Pendidikan Tinggi (LLDIKTI)',
        ];
    }

    private function getIkuMaster(): array
    {
        return [
            'IKU 1.1' => ['nama' => 'Kepuasan pengguna terhadap layanan utama LLDIKTI',                                                                                                          'satuan' => '%',        'target' => '89,75'],
            'IKU 1.2' => ['nama' => 'Persentase PTS yang terakreditasi atau meningkatkan mutu dengan cara penggabungan dengan PTS lain',                                                          'satuan' => '%',        'target' => '90,43'],
            'IKU 2.1' => ['nama' => 'Persentase PTS yang menyelenggarakan kegiatan pembelajaran di luar program studi',                                                                           'satuan' => '%',        'target' => '70,55'],
            'IKU 2.2' => ['nama' => 'Persentase mahasiswa S1 atau D4/D3/D2/D1 PTS yang menjalankan kegiatan pembelajaran di luar program studi atau meraih prestasi',                            'satuan' => '%',        'target' => '11'],
            'IKU 2.3' => ['nama' => 'Persentase PTS yang mengimplementasikan kebijakan antiintoleransi, antikekerasan seksual, antiperundungan, antinarkoba, dan antikorupsi',                   'satuan' => '%',        'target' => '71,88'],
            'IKU 3.1' => ['nama' => 'Persentase PTS yang berhasil meningkatkan kinerja dengan meningkatkan jumlah dosen yang berkegiatan di luar kampus',                                        'satuan' => '%',        'target' => '62,6'],
            'IKU 3.2' => ['nama' => 'Persentase PTS yang berhasil meningkatkan kinerja dengan meningkatkan jumlah program studi yang bekerja sama dengan mitra',                                 'satuan' => '%',        'target' => '48,5'],
            'IKU 4.1' => ['nama' => 'Predikat SAKIP',                                                                                                                                           'satuan' => 'Predikat', 'target' => 'A'],
            'IKU 4.2' => ['nama' => 'Nilai Kinerja Anggaran atas Pelaksanaan RKA-K/L',                                                                                                          'satuan' => 'Nilai',    'target' => '98,7'],
        ];
    }

    private function getTwMaster(): array
    {
        return [
            'IKU 1.1' => ['tw1' => '89,75', 'tw2' => '89,75', 'tw3' => '89,75', 'tw4' => '89,75'],
            'IKU 1.2' => ['tw1' => '88,00', 'tw2' => '88,13', 'tw3' => '89,00', 'tw4' => '90,43'],
            'IKU 2.1' => ['tw1' => '70,52', 'tw2' => '70,53', 'tw3' => '70,54', 'tw4' => '70,55'],
            'IKU 2.2' => ['tw1' => '10,99', 'tw2' => '10,99', 'tw3' => '11',    'tw4' => '11'],
            'IKU 2.3' => ['tw1' => '70,90', 'tw2' => '71,00', 'tw3' => '71,40', 'tw4' => '71,88'],
            'IKU 3.1' => ['tw1' => '61,00', 'tw2' => '61,50', 'tw3' => '62,00', 'tw4' => '62,6'],
            'IKU 3.2' => ['tw1' => '48,00', 'tw2' => '48,00', 'tw3' => '48,30', 'tw4' => '48,5'],
            'IKU 4.1' => ['tw1' => '-',     'tw2' => '-',     'tw3' => '-',     'tw4' => 'A'],
            'IKU 4.2' => ['tw1' => '0',     'tw2' => '0',     'tw3' => '0',     'tw4' => '98,7'],
        ];
    }

    /**
     * PK IKU Map: satu PK untuk TK-PK berisi SEMUA sasaran dan IKU.
     * Urutan array menentukan urutan tampil.
     */
    private function getPkIkuMap(): array
    {
        return [
            'S 1' => ['IKU 1.1', 'IKU 1.2'],
            'S 2' => ['IKU 2.1', 'IKU 2.2', 'IKU 2.3'],
            'S 3' => ['IKU 3.1', 'IKU 3.2'],
            'S 4' => ['IKU 4.1', 'IKU 4.2'],
        ];
    }

    /**
     * PIC primer per IKU (tim kerja yang bertanggung jawab utama).
     */
    private function getPicPrimerMap(): array
    {
        return [
            'IKU 1.1' => 'TK-HMK',
            'IKU 1.2' => 'TK-PENJAMU',
            'IKU 2.1' => 'TK-PENJAMU',
            'IKU 2.2' => 'TK-BELMAWA',
            'IKU 2.3' => 'TK-ADIA',
            'IKU 3.1' => 'TK-SD',
            'IKU 3.2' => 'TK-RPM',
            'IKU 4.1' => 'TK-PK',
            'IKU 4.2' => 'TK-PK',
        ];
    }

    /**
     * Co-PIC tambahan per IKU (selain primary PIC).
     */
    private function getCoPicMap(): array
    {
        return [
            'IKU 1.2' => ['TK-KK'],
            'IKU 2.1' => ['TK-BELMAWA'],
            'IKU 3.2' => ['TK-KK'],
            'IKU 4.1' => ['TK-HKT'],
            'IKU 4.2' => ['TK-HKT'],
        ];
    }

    /**
     * RA IKU Map: tetap per tim kerja berdasarkan PIC primer.
     * Sasaran referensi diambil dari PK Awal TK-PK.
     */
    private function getRaIkuMap(): array
    {
        return [
            'TK-HMK'    => ['S 1' => ['IKU 1.1']],
            'TK-PENJAMU' => ['S 1' => ['IKU 1.2'], 'S 2' => ['IKU 2.1']],
            'TK-BELMAWA' => ['S 2' => ['IKU 2.2']],
            'TK-ADIA'    => ['S 2' => ['IKU 2.3']],
            'TK-SD'      => ['S 3' => ['IKU 3.1']],
            'TK-RPM'     => ['S 3' => ['IKU 3.2']],
            'TK-PK'      => ['S 4' => ['IKU 4.1', 'IKU 4.2']],
        ];
    }

    /** Demo realisasi TW1 untuk modul Pengukuran */
    private function getRealisasiTw1Master(): array
    {
        return [
            'IKU 1.1' => [
                'realisasi'              => '89,50',
                'progress_kegiatan'      => 'Survei kepuasan pengguna telah dilaksanakan pada triwulan pertama dengan tingkat respons yang baik.',
                'kendala'                => 'Tingkat respons survei dari beberapa PTS masih perlu ditingkatkan.',
                'strategi_tindak_lanjut' => 'Follow-up kepada responden yang belum mengisi survei melalui koordinasi langsung.',
            ],
            'IKU 1.2' => [
                'realisasi'              => '87,75',
                'progress_kegiatan'      => 'Monitoring proses akreditasi dan reakreditasi PTS berjalan sesuai jadwal. Pendampingan administratif terus dilakukan.',
                'kendala'                => 'Beberapa PTS terkendala administrasi pengajuan akreditasi ke BAN-PT.',
                'strategi_tindak_lanjut' => 'Pendampingan intensif kepada PTS yang mengalami hambatan, termasuk konsultasi daring.',
            ],
            'IKU 2.1' => [
                'realisasi'              => '70,50',
                'progress_kegiatan'      => 'Fasilitasi implementasi program pembelajaran di luar prodi (MBKM) di PTS terus berjalan.',
                'kendala'                => 'Sebagian PTS masih dalam tahap penyesuaian kurikulum agar sesuai standar MBKM.',
                'strategi_tindak_lanjut' => 'Bimbingan teknis penyusunan kurikulum berbasis MBKM dijadwalkan bulan berikutnya.',
            ],
            'IKU 2.2' => [
                'realisasi'              => '10,50',
                'progress_kegiatan'      => 'Jumlah mahasiswa S1/D4/D3 yang mengikuti kegiatan di luar prodi terus bertambah.',
                'kendala'                => 'Masih ada PTS yang belum memahami mekanisme pelaporan peserta MBKM di PDDikti.',
                'strategi_tindak_lanjut' => 'Sosialisasi dan workshop mekanisme pelaporan MBKM kepada operator PTS.',
            ],
            'IKU 2.3' => [
                'realisasi'              => '70,75',
                'progress_kegiatan'      => 'Sosialisasi kebijakan antiintoleransi, antikekerasan seksual, dan antiperundungan telah dilaksanakan kepada PTS.',
                'kendala'                => 'Komitmen implementasi kebijakan di tingkat PTS masih bervariasi.',
                'strategi_tindak_lanjut' => 'Monitoring dan evaluasi berkala melalui form pelaporan implementasi kebijakan.',
            ],
            'IKU 3.1' => [
                'realisasi'              => '60,80',
                'progress_kegiatan'      => 'Program mobilisasi dosen ke industri dan perguruan tinggi mitra sedang berjalan.',
                'kendala'                => 'Keterbatasan jumlah mitra yang bersedia menerima dosen tamu dalam jangka pendek.',
                'strategi_tindak_lanjut' => 'Perluasan jejaring mitra industri dan akademisi untuk program dosen berkegiatan.',
            ],
            'IKU 3.2' => [
                'realisasi'              => '47,50',
                'progress_kegiatan'      => 'Fasilitasi penandatanganan MoU antara prodi PTS dengan mitra nasional dan internasional sedang berjalan.',
                'kendala'                => 'Proses negosiasi MoU memerlukan waktu lebih lama dari yang direncanakan.',
                'strategi_tindak_lanjut' => 'Penyederhanaan prosedur administratif dan pendampingan negosiasi kerja sama.',
            ],
            'IKU 4.1' => [
                'realisasi'              => '-',
                'progress_kegiatan'      => 'Penyusunan dokumen SAKIP triwulan I sedang berlangsung, termasuk penyusunan laporan kinerja interim.',
                'kendala'                => 'Pengumpulan data kinerja dari seluruh unit memerlukan koordinasi yang intensif.',
                'strategi_tindak_lanjut' => 'Rapat koordinasi rutin penyusunan dokumen SAKIP dijadwalkan setiap dua minggu.',
            ],
            'IKU 4.2' => [
                'realisasi'              => '0',
                'progress_kegiatan'      => 'Pelaksanaan anggaran baru dimulai, serapan masih dalam tahap awal (proses pengadaan).',
                'kendala'                => 'Proses pengadaan barang dan jasa memerlukan waktu lebih lama dari yang direncanakan.',
                'strategi_tindak_lanjut' => 'Percepatan proses pengadaan dan penyelesaian administrasi keuangan sesuai jadwal RKA.',
            ],
        ];
    }
}
