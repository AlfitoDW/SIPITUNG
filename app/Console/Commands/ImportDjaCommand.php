<?php

namespace App\Console\Commands;

use App\Models\DjaKegiatan;
use App\Models\DjaKomponen;
use App\Models\DjaKro;
use App\Models\DjaProgram;
use App\Models\DjaRincianBiaya;
use App\Models\DjaRo;
use App\Models\DjaSasaran;
use App\Models\DjaSubKegiatan;
use App\Models\TahunAnggaran;
use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Import DJA dari file Excel via CLI.
 * Usage: php artisan dja:import "bahan_keuangan/1. Rev. DJA Prioritas...xlsx"
 */
class ImportDjaCommand extends Command
{
    protected $signature = 'dja:import {file : Path ke file .xlsx, relatif ke base_path() atau absolute}';

    protected $description = 'Import DJA hierarchy (Program → Sasaran → KRO → RO → Komponen → Kegiatan → Rincian Biaya) dari file Excel';

    public function handle(): int
    {
        $file = $this->argument('file');
        $path = file_exists($file) ? $file : base_path($file);

        if (! file_exists($path)) {
            $this->error("File tidak ditemukan: {$path}");

            return self::FAILURE;
        }

        $this->info("Loading file: {$path}");
        $tahun = TahunAnggaran::forSession();
        $this->info("Tahun anggaran aktif: {$tahun->tahun}");

        $spreadsheet = IOFactory::load($path);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);

        $currentProgram = null;
        $currentSasaran = null;
        $currentKro = null;
        $currentRo = null;
        $currentKomponen = null;
        $currentKegiatan = null;
        $currentSubKegiatan = null;
        $urutan = 0;
        $imported = 0;

        $paguInt = fn ($v) => (int) preg_replace('/[^\d]/', '', (string) ($v ?? 0));
        $parseDecimal = fn ($v) => (float) preg_replace('/[^\d.]/', '', str_replace(',', '', (string) ($v ?? 0)));

        $bar = $this->output->createProgressBar(count($rows));
        $bar->start();

        foreach ($rows as $rowNum => $row) {
            $bar->advance();
            $a = trim((string) ($row['A'] ?? ''));
            $b = trim((string) ($row['B'] ?? ''));
            $c = trim((string) ($row['C'] ?? ''));
            $d = trim((string) ($row['D'] ?? ''));
            $e = trim((string) ($row['E'] ?? ''));
            $f = trim((string) ($row['F'] ?? ''));

            if ($a === '' && $b === '') {
                continue;
            }

            // Program
            if (preg_match('/^\d{3}\.\d{2}\.[A-Z]{2,3}$/', $a)) {
                $currentProgram = DjaProgram::updateOrCreate(
                    ['kode' => $a, 'tahun_anggaran' => $tahun->tahun],
                    ['nama' => $b, 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentSasaran = $currentKro = $currentRo = $currentKomponen = $currentKegiatan = null;
                $imported++;

                continue;
            }

            // Sasaran
            if (preg_match('/^\d{4}$/', $a) && $currentProgram) {
                $currentSasaran = DjaSasaran::updateOrCreate(
                    ['program_id' => $currentProgram->id, 'kode' => $a],
                    ['nama' => $b, 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentKro = $currentRo = $currentKomponen = $currentKegiatan = null;
                $imported++;

                continue;
            }

            // KRO
            if (preg_match('/^\d{4}\.[A-Z]{3}$/', $a) && $currentSasaran) {
                $currentKro = DjaKro::updateOrCreate(
                    ['sasaran_id' => $currentSasaran->id, 'kode' => $a],
                    ['nama' => $b, 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentRo = $currentKomponen = $currentKegiatan = null;
                $imported++;

                continue;
            }

            // RO
            if (preg_match('/^\d{4}\.[A-Z]{3}\.\d{3}$/', $a) && $currentKro) {
                $currentRo = DjaRo::updateOrCreate(
                    ['kro_id' => $currentKro->id, 'kode' => $a],
                    ['nama' => $b, 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentKomponen = $currentKegiatan = null;
                $imported++;

                continue;
            }

            // Komponen
            if (preg_match('/^\d{3}$/', $a) && $currentRo) {
                $currentKomponen = DjaKomponen::updateOrCreate(
                    ['ro_id' => $currentRo->id, 'kode' => $a],
                    ['nama' => $b, 'jenis' => 'Utama', 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentKegiatan = null;
                $imported++;

                continue;
            }

            // Kegiatan
            if (preg_match('/^[A-Z]$/', $a) && $currentKomponen) {
                $currentKegiatan = DjaKegiatan::updateOrCreate(
                    ['komponen_id' => $currentKomponen->id, 'kode' => $a],
                    ['nama' => $b, 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentSubKegiatan = null;
                $urutan = 0;
                $imported++;

                continue;
            }

            // Kode Akun
            if (preg_match('/^\d{6}$/', $a) && $currentKegiatan) {
                $currentSubKegiatan = DjaSubKegiatan::updateOrCreate(
                    ['kegiatan_id' => $currentKegiatan->id, 'kode_akun' => $a],
                    [
                        'nama_akun' => $b,
                        'pagu' => $paguInt($f),
                        'urutan' => $urutan + 1,
                        'is_aktif' => true,
                    ]
                );
                $urutan = 0;
                $imported++;

                continue;
            }

            // Rincian Biaya
            if ($a === '' && $b !== '' && $currentSubKegiatan) {
                $urutan++;
                DjaRincianBiaya::updateOrCreate(
                    ['sub_kegiatan_id' => $currentSubKegiatan->id, 'nama_item' => $b],
                    [
                        'volume_default' => is_numeric(str_replace(['.', ','], ['', '.'], $c)) ? (float) str_replace(['.', ','], ['', '.'], $c) : 0,
                        'satuan' => $d ?: 'OK',
                        'harga_satuan' => $parseDecimal($e),
                        'pagu_total' => $parseDecimal($f),
                        'urutan' => $urutan,
                        'is_aktif' => true,
                    ]
                );
                $imported++;
            }
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("✅ Selesai. {$imported} baris diproses.");
        $this->info('  - Program: '.DjaProgram::count());
        $this->info('  - Sasaran: '.DjaSasaran::count());
        $this->info('  - KRO: '.DjaKro::count());
        $this->info('  - RO: '.DjaRo::count());
        $this->info('  - Komponen: '.DjaKomponen::count());
        $this->info('  - Kegiatan: '.DjaKegiatan::count());
        $this->info('  - Sub Kegiatan: '.DjaSubKegiatan::count());
        $this->info('  - Rincian Biaya: '.DjaRincianBiaya::count());

        return self::SUCCESS;
    }
}
