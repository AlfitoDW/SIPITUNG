<?php

namespace Database\Seeders;

use App\Models\IndikatorKinerja;
use App\Models\PerjanjianKinerja;
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
        $timPKU = TimKerja::where('kode', 'TK-PKU')->first();
        $ketuaPKU = User::where('username', 'ketua.pku')->first();

        if (! $tahun || ! $timPKU || ! $ketuaPKU) {
            $this->command->warn('PerencanaanSeeder: pastikan TahunAnggaranSeeder, TimKerjaSeeder, dan UserSeeder sudah dijalankan terlebih dahulu.');
            return;
        }

        $sasaranData = $this->getSasaranData();

        // --- Perjanjian Kinerja Awal ---
        $pk = PerjanjianKinerja::firstOrCreate(
            [
                'tahun_anggaran_id' => $tahun->id,
                'tim_kerja_id'      => $timPKU->id,
                'jenis'             => 'awal',
            ],
            [
                'status'     => 'draft',
                'created_by' => $ketuaPKU->id,
            ]
        );

        foreach ($sasaranData as $urutan => $s) {
            $sasaran = Sasaran::firstOrCreate(
                ['perjanjian_kinerja_id' => $pk->id, 'kode' => $s['kode']],
                ['nama' => $s['nama'], 'urutan' => $urutan + 1]
            );

            foreach ($s['indikators'] as $ikuUrutan => $iku) {
                IndikatorKinerja::firstOrCreate(
                    ['sasaran_id' => $sasaran->id, 'kode' => $iku['kode']],
                    [
                        'nama'    => $iku['nama'],
                        'satuan'  => $iku['satuan'],
                        'target'  => $iku['target'],
                        'urutan'  => $ikuUrutan + 1,
                    ]
                );
            }
        }

        // --- Perjanjian Kinerja Revisi ---
        $pkRevisi = PerjanjianKinerja::firstOrCreate(
            [
                'tahun_anggaran_id' => $tahun->id,
                'tim_kerja_id'      => $timPKU->id,
                'jenis'             => 'revisi',
            ],
            [
                'status'     => 'draft',
                'created_by' => $ketuaPKU->id,
            ]
        );

        foreach ($sasaranData as $urutan => $s) {
            $sasaran = Sasaran::firstOrCreate(
                ['perjanjian_kinerja_id' => $pkRevisi->id, 'kode' => $s['kode']],
                ['nama' => $s['nama'], 'urutan' => $urutan + 1]
            );

            foreach ($s['indikators'] as $ikuUrutan => $iku) {
                IndikatorKinerja::firstOrCreate(
                    ['sasaran_id' => $sasaran->id, 'kode' => $iku['kode']],
                    [
                        'nama'    => $iku['nama'],
                        'satuan'  => $iku['satuan'],
                        'target'  => $iku['target'],
                        'urutan'  => $ikuUrutan + 1,
                    ]
                );
            }
        }

        // --- Rencana Aksi ---
        $ra = RencanaAksi::firstOrCreate(
            [
                'tahun_anggaran_id' => $tahun->id,
                'tim_kerja_id'      => $timPKU->id,
            ],
            [
                'status'     => 'draft',
                'created_by' => $ketuaPKU->id,
            ]
        );

        $urutan = 1;
        foreach ($this->getRaIndikatorData() as $iku) {
            RencanaAksiIndikator::firstOrCreate(
                ['rencana_aksi_id' => $ra->id, 'kode' => $iku['kode']],
                [
                    'nama'       => $iku['nama'],
                    'satuan'     => $iku['satuan'],
                    'target'     => $iku['target'],
                    'target_tw1' => $iku['tw1'],
                    'target_tw2' => $iku['tw2'],
                    'target_tw3' => $iku['tw3'],
                    'target_tw4' => $iku['tw4'],
                    'urutan'     => $urutan++,
                ]
            );
        }
    }

    private function getSasaranData(): array
    {
        return [
            [
                'kode' => 'S 1',
                'nama' => 'Meningkatnya kualitas layanan Lembaga Layanan Pendidikan Tinggi (LLDIKTI)',
                'indikators' => [
                    ['kode' => 'IKU 1.1', 'nama' => 'Kepuasan pengguna terhadap layanan utama LLDIKTI', 'satuan' => '%', 'target' => '89,75'],
                    ['kode' => 'IKU 1.2', 'nama' => 'Persentase PTS yang terakreditasi atau meningkatkan mutu dengan cara penggabungan dengan PTS lain', 'satuan' => '%', 'target' => '90,43'],
                ],
            ],
            [
                'kode' => 'S 2',
                'nama' => 'Meningkatnya efektivitas sosialisasi kebijakan pendidikan tinggi',
                'indikators' => [
                    ['kode' => 'IKU 2.1', 'nama' => 'Persentase PTS yang menyelenggarakan kegiatan pembelajaran di luar program studi', 'satuan' => '%', 'target' => '70,55'],
                    ['kode' => 'IKU 2.2', 'nama' => 'Persentase mahasiswa S1 atau D4/D3/D2/D1 PTS yang menjalankan kegiatan pembelajaran di luar program studi atau meraih prestasi', 'satuan' => '%', 'target' => '11'],
                    ['kode' => 'IKU 2.3', 'nama' => 'Persentase PTS yang mengimplementasikan kebijakan antiintoleransi, antikekerasan seksual, antiperundungan, antinarkoba, dan antikorupsi', 'satuan' => '%', 'target' => '71,88'],
                ],
            ],
            [
                'kode' => 'S 3',
                'nama' => 'Meningkatnya inovasi perguruan tinggi dalam rangka meningkatkan mutu pendidikan',
                'indikators' => [
                    ['kode' => 'IKU 3.1', 'nama' => 'Persentase PTS yang berhasil meningkatkan kinerja dengan meningkatkan jumlah dosen yang berkegiatan di luar kampus', 'satuan' => '%', 'target' => '62,6'],
                    ['kode' => 'IKU 3.2', 'nama' => 'Persentase PTS yang berhasil meningkatkan kinerja dengan meningkatkan jumlah program studi yang bekerja sama dengan mitra', 'satuan' => '%', 'target' => '48,5'],
                ],
            ],
            [
                'kode' => 'S 4',
                'nama' => 'Meningkatnya tata kelola Lembaga Layanan Pendidikan Tinggi (LLDIKTI)',
                'indikators' => [
                    ['kode' => 'IKU 4.1', 'nama' => 'Predikat SAKIP', 'satuan' => 'Predikat', 'target' => 'A'],
                    ['kode' => 'IKU 4.2', 'nama' => 'Nilai Kinerja Anggaran atas Pelaksanaan RKA-K/L', 'satuan' => 'Nilai', 'target' => '98,7'],
                ],
            ],
        ];
    }

    private function getRaIndikatorData(): array
    {
        return [
            ['kode' => 'IKU 1.1', 'nama' => 'Kepuasan pengguna terhadap layanan utama LLDIKTI',                                                                                                             'satuan' => '%',        'target' => '89,75', 'tw1' => '89,75', 'tw2' => '89,75', 'tw3' => '89,75', 'tw4' => '89,75'],
            ['kode' => 'IKU 1.2', 'nama' => 'Persentase PTS yang terakreditasi atau meningkatkan mutu dengan cara penggabungan dengan PTS lain',                                                             'satuan' => '%',        'target' => '90,43', 'tw1' => '88,00', 'tw2' => '88,13', 'tw3' => '89,00', 'tw4' => '90,43'],
            ['kode' => 'IKU 2.1', 'nama' => 'Persentase PTS yang menyelenggarakan kegiatan pembelajaran di luar program studi',                                                                              'satuan' => '%',        'target' => '70,55', 'tw1' => '70,52', 'tw2' => '70,53', 'tw3' => '70,54', 'tw4' => '70,55'],
            ['kode' => 'IKU 2.2', 'nama' => 'Persentase mahasiswa S1 atau D4/D3/D2/D1 PTS yang menjalankan kegiatan pembelajaran di luar program studi atau meraih prestasi',                               'satuan' => '%',        'target' => '11',    'tw1' => '10,99', 'tw2' => '10,99', 'tw3' => '11',    'tw4' => '11'],
            ['kode' => 'IKU 2.3', 'nama' => 'Persentase PTS yang mengimplementasikan kebijakan antiintoleransi, antikekerasan seksual, antiperundungan, antinarkoba, dan antikorupsi',                      'satuan' => '%',        'target' => '71,88', 'tw1' => '70,90', 'tw2' => '71,00', 'tw3' => '71,40', 'tw4' => '71,88'],
            ['kode' => 'IKU 3.1', 'nama' => 'Persentase PTS yang berhasil meningkatkan kinerja dengan meningkatkan jumlah dosen yang berkegiatan di luar kampus',                                           'satuan' => '%',        'target' => '62,6',  'tw1' => '61,00', 'tw2' => '61,50', 'tw3' => '62,00', 'tw4' => '62,6'],
            ['kode' => 'IKU 3.2', 'nama' => 'Persentase PTS yang berhasil meningkatkan kinerja dengan meningkatkan jumlah program studi yang bekerja sama dengan mitra',                                    'satuan' => '%',        'target' => '48,5',  'tw1' => '48,00', 'tw2' => '48,00', 'tw3' => '48,30', 'tw4' => '48,5'],
            ['kode' => 'IKU 4.1', 'nama' => 'Predikat SAKIP',                                                                                                                                               'satuan' => 'Predikat', 'target' => 'A',     'tw1' => '-',     'tw2' => '-',     'tw3' => '-',     'tw4' => 'A'],
            ['kode' => 'IKU 4.2', 'nama' => 'Nilai Kinerja Anggaran atas Pelaksanaan RKA-K/L',                                                                                                              'satuan' => 'Nilai',    'target' => '98,7',  'tw1' => '0',     'tw2' => '0',     'tw3' => '0',     'tw4' => '98,7'],
        ];
    }
}
