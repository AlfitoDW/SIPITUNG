<?php

namespace Database\Seeders;

use App\Models\IndikatorKinerja;
use App\Models\MasterSasaran;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
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

        // ── Seed periode pengukuran (TW1–TW4, TW1 aktif sebagai default) ────────
        foreach (['TW1' => true, 'TW2' => false, 'TW3' => false, 'TW4' => false] as $tw => $aktif) {
            PeriodePengukuran::updateOrCreate(
                ['tahun_anggaran_id' => $tahun->id, 'triwulan' => $tw],
                ['is_active' => $aktif]
            );
        }

        $sasaranNamas = $this->getSasaranNamas();
        $ikuMaster = $this->getIkuMaster();
        $twMaster = $this->getTwMaster();
        $picPrimerMap = $this->getPicPrimerMap();
        $coPicMap = $this->getCoPicMap();

        // ── Seed master sasaran ──────────────────────────────────────────────────
        foreach ($sasaranNamas as $kode => $nama) {
            MasterSasaran::updateOrCreate(
                ['tahun_anggaran_id' => $tahun->id, 'kode' => $kode],
                [
                    'nama' => $nama,
                    'urutan' => (int) str_replace('S ', '', $kode),
                ]
            );
        }

        // ── PK Awal & Revisi: SATU PK milik TK-PK, berisi SEMUA IKU ────────────
        $tkPk = TimKerja::where('kode', 'TK-PK')->firstOrFail();
        $ketua = User::where('tim_kerja_id', $tkPk->id)->where('role', 'ketua_tim_kerja')->first();
        $createdBy = $ketua?->id ?? 1;

        $pkAwal = PerjanjianKinerja::updateOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $tkPk->id, 'jenis' => 'awal'],
            ['status' => 'draft', 'created_by' => $createdBy]
        );

        // Mapping sasaran → IKU untuk PK (semua IKU, diurutkan kode sasaran → kode IKU)
        $pkIkuMap = $this->getPkIkuMap();
        foreach ($pkIkuMap as $sasKode => $ikuKodes) {
            $sasaran = Sasaran::updateOrCreate(
                ['perjanjian_kinerja_id' => $pkAwal->id, 'kode' => $sasKode],
                ['nama' => $sasaranNamas[$sasKode], 'urutan' => (int) str_replace('S ', '', $sasKode)]
            );

            foreach ($ikuKodes as $urutan => $ikuKode) {
                $ikuData = $ikuMaster[$ikuKode];
                $tw = $twMaster[$ikuKode] ?? ['tw1' => null, 'tw2' => null, 'tw3' => null, 'tw4' => null];
                $picPrimer = TimKerja::where('kode', $picPrimerMap[$ikuKode])->first();

                $iku = IndikatorKinerja::updateOrCreate(
                    ['sasaran_id' => $sasaran->id, 'kode' => $ikuKode],
                    [
                        'nama' => $ikuData['nama'],
                        'satuan' => $ikuData['satuan'],
                        'target' => $ikuData['target'],
                        'target_tw1' => $tw['tw1'],
                        'target_tw2' => $tw['tw2'],
                        'target_tw3' => $tw['tw3'],
                        'target_tw4' => $tw['tw4'],
                        'urutan' => $urutan + 1,
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
            }
        }

        // ── PK Revisi: copy langsung dari PK Awal ────────────────────────────────
        $pkRevisi = PerjanjianKinerja::updateOrCreate(
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
                        'nama' => $ikuAwal->nama,
                        'satuan' => $ikuAwal->satuan,
                        'target' => $ikuAwal->target,
                        'target_tw1' => $ikuAwal->target_tw1,
                        'target_tw2' => $ikuAwal->target_tw2,
                        'target_tw3' => $ikuAwal->target_tw3,
                        'target_tw4' => $ikuAwal->target_tw4,
                        'urutan' => $ikuAwal->urutan,
                        'pic_tim_kerja_id' => $ikuAwal->pic_tim_kerja_id,
                    ]
                );
                $ikuRevisi->picTimKerjas()->syncWithoutDetaching(
                    $ikuAwal->picTimKerjas->pluck('id')->all()
                );
            }
        }

        $this->command->info('PerencanaanSeeder: PK Awal & Revisi berhasil di-seed.');
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
}
