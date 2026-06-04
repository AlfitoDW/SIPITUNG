<?php

namespace App\Exports;

use App\Models\PermohonanDana;
use App\Models\User;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Export Daftar Nominatif menggunakan template Excel dari LLDIKTI.
 * Template: storage/app/templates/nominatif_template.xlsx
 * Per kode akun ada sheet sendiri dengan styling lengkap.
 * Logic ini hanya isi data + header dinamis + footer signature.
 */
class NominatifExport
{
    private PermohonanDana $pd;
    private ?User $ppk;
    private ?User $bendahara;
    private string $tglNominatif;

    private const HONOR_AKUN = ['521115', '521213', '522151'];
    private const PERJADIN_LUAR_AKUN = ['524111', '524119'];
    private const PERJADIN_DALAM_AKUN = ['524113', '524114'];
    private const ALL_AKUN = ['521115', '521213', '522151', '524111', '524113', '524114', '524119'];

    /**
     * Config per kode akun: posisi data, jumlah row, footer.
     * dataStartRow = baris pertama data (di template)
     * dataEndRow = baris terakhir placeholder data (di template)
     * jumlahRow = baris "Jumlah" (di template)
     * jakartaRow = baris "Jakarta, ..." (di template)
     */
    private const CONFIG = [
        '521115' => [
            'dataStartRow' => 12, 'dataEndRow' => 14, 'jumlahRow' => 16, 'terbilangRow' => 17,
            'jakartaRow' => 22, 'mengetahuiRow' => 23, 'anKuasaRow' => 24, 'pejabatRow' => 25,
            'ppkNameRow' => 29, 'ppkNipRow' => 30, 'jakartaCol' => 'M',
            'titleRow' => 5, 'subtitleRow' => 6, 'kodeAkunRow' => 7, 'lastCol' => 'P',
        ],
        '521213' => [
            'dataStartRow' => 14, 'dataEndRow' => 16, 'jumlahRow' => 18, 'terbilangRow' => 19,
            'jakartaRow' => 24, 'mengetahuiRow' => 25, 'anKuasaRow' => 26, 'pejabatRow' => 27,
            'ppkNameRow' => 31, 'ppkNipRow' => 32, 'jakartaCol' => 'N',
            'titleRow' => 5, 'kegiatanRow' => 6, 'lingkunganRow' => 7, 'tanggalRow' => 8,
            'kodeAkunRow' => 9, 'lastCol' => 'Q',
        ],
        '522151' => [
            'dataStartRow' => 14, 'dataEndRow' => 16, 'jumlahRow' => 18, 'terbilangRow' => 19,
            'jakartaRow' => 24, 'mengetahuiRow' => 25, 'anKuasaRow' => 26, 'pejabatRow' => 27,
            'ppkNameRow' => 31, 'ppkNipRow' => 32, 'jakartaCol' => 'N',
            'titleRow' => 5, 'kegiatanRow' => 6, 'lingkunganRow' => 7, 'tanggalRow' => 8,
            'kodeAkunRow' => 9, 'lastCol' => 'Q',
        ],
        '524111' => [
            'dataStartRow' => 14, 'dataEndRow' => 44, 'jumlahRow' => 45, 'terbilangRow' => 46,
            'jakartaRow' => 48, 'mengetahuiRow' => 49, 'anKuasaRow' => 50, 'pejabatRow' => 51,
            'ppkNameRow' => 55, 'ppkNipRow' => 56, 'jakartaCol' => 'S',
            'titleRow' => 5, 'kegiatanRow' => 6, 'lingkunganRow' => 7, 'tanggalRow' => 8,
            'kodeAkunRow' => 9, 'lastCol' => 'U',
        ],
        '524119' => [
            'dataStartRow' => 14, 'dataEndRow' => 44, 'jumlahRow' => 45, 'terbilangRow' => 46,
            'jakartaRow' => 48, 'mengetahuiRow' => 49, 'anKuasaRow' => 50, 'pejabatRow' => 51,
            'ppkNameRow' => 55, 'ppkNipRow' => 56, 'jakartaCol' => 'S',
            'titleRow' => 5, 'kegiatanRow' => 6, 'lingkunganRow' => 7, 'tanggalRow' => 8,
            'kodeAkunRow' => 9, 'lastCol' => 'U',
        ],
        '524113' => [
            'dataStartRow' => 14, 'dataEndRow' => 43, 'jumlahRow' => 44, 'terbilangRow' => 45,
            'jakartaRow' => 47, 'mengetahuiRow' => 48, 'anKuasaRow' => 49, 'pejabatRow' => 50,
            'ppkNameRow' => 54, 'ppkNipRow' => 55, 'jakartaCol' => 'Q',
            'titleRow' => 5, 'kegiatanRow' => 6, 'lingkunganRow' => 7, 'tanggalRow' => 8,
            'kodeAkunRow' => 9, 'lastCol' => 'S',
        ],
        '524114' => [
            'dataStartRow' => 14, 'dataEndRow' => 43, 'jumlahRow' => 44, 'terbilangRow' => 45,
            'jakartaRow' => 47, 'mengetahuiRow' => 48, 'anKuasaRow' => 49, 'pejabatRow' => 50,
            'ppkNameRow' => 54, 'ppkNipRow' => 55, 'jakartaCol' => 'Q',
            'titleRow' => 5, 'kegiatanRow' => 6, 'lingkunganRow' => 7, 'tanggalRow' => 8,
            'kodeAkunRow' => 9, 'lastCol' => 'S',
        ],
    ];

    public function __construct(PermohonanDana $pd)
    {
        $this->pd = $pd;
        $this->pd->load(['items.nominatif', 'items.djaRincianBiaya', 'timKerja', 'djaKegiatan', 'ppkApprovedBy', 'dicairkanBy']);
        $this->ppk = $this->pd->ppkApprovedBy;
        $this->bendahara = $this->pd->dicairkanBy;
        $this->tglNominatif = $this->pd->tgl_nominatif
            ? $this->pd->tgl_nominatif->locale('id')->isoFormat('D MMMM YYYY')
            : now()->locale('id')->isoFormat('D MMMM YYYY');
    }

    public function download(): StreamedResponse
    {
        $templatePath = storage_path('app/templates/nominatif_template.xlsx');
        if (! file_exists($templatePath)) {
            abort(500, 'Template nominatif tidak ditemukan.');
        }

        $spreadsheet = IOFactory::load($templatePath);

        // Group nominatif by kode_akun
        $grouped = $this->pd->items->filter(fn ($i) => in_array($i->kode_akun, self::ALL_AKUN))->groupBy('kode_akun');

        $usedSheets = [];
        foreach ($grouped as $kodeAkun => $items) {
            $kodeAkun = (string) $kodeAkun;
            $sheet = $spreadsheet->getSheetByName($kodeAkun);
            if (! $sheet) continue;

            $allNominatif = collect();
            foreach ($items as $item) {
                foreach ($item->nominatif as $nom) {
                    $allNominatif->push($nom);
                }
            }
            // Merge per orang untuk perjadin
            if (! in_array($kodeAkun, self::HONOR_AKUN)) {
                $allNominatif = $this->mergePerjadinPerOrang($allNominatif);
            }

            $namaItem = $items->first()->djaRincianBiaya?->nama_item ?? $items->first()->uraian ?? '';
            $this->fillSheet($sheet, $kodeAkun, $allNominatif, $namaItem);
            $usedSheets[] = $kodeAkun;
        }

        // Hapus sheet yang tidak dipakai
        foreach ($spreadsheet->getSheetNames() as $name) {
            if (! in_array($name, $usedSheets)) {
                $idx = $spreadsheet->getIndex($spreadsheet->getSheetByName($name));
                $spreadsheet->removeSheetByIndex($idx);
            }
        }

        if (count($spreadsheet->getAllSheets()) === 0) {
            $sheet = $spreadsheet->createSheet();
            $sheet->setTitle('Nominatif');
            $sheet->setCellValue('A1', 'Belum ada data nominatif untuk permohonan ini.');
        }

        // Hapus semua defined names yang punya external references
        // untuk menghindari warning "external links" saat buka file
        $reflection = new \ReflectionClass($spreadsheet);
        if ($reflection->hasProperty('definedNames')) {
            $prop = $reflection->getProperty('definedNames');
            $prop->setValue($spreadsheet, []);
        }

        // Hapus data validations dari semua sheet (template punya validation yang reference sheet lain)
        foreach ($spreadsheet->getAllSheets() as $s) {
            // Clear all data validations by iterating cells
            $reflectSheet = new \ReflectionClass($s);
            if ($reflectSheet->hasProperty('dataValidationCollection')) {
                $dvProp = $reflectSheet->getProperty('dataValidationCollection');
                $dvProp->setValue($s, []);
            }
        }

        $spreadsheet->setActiveSheetIndex(0);
        $nomor = str_replace('/', '-', $this->pd->nomor_permohonan);
        $filename = "Nominatif_{$nomor}.xlsx";
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }

    private function mergePerjadinPerOrang($rows)
    {
        $grouped = $rows->groupBy(fn ($n) => $n->ref_nama_id ? 'r'.$n->ref_nama_id : 'n'.strtolower(trim($n->nama)));
        return $grouped->map(function ($g) {
            if ($g->count() === 1) return $g->first();
            $b = clone $g->first();
            $b->transport = $g->sum(fn ($r) => (float) $r->transport);
            $b->uang_harian_vol = $g->max(fn ($r) => (float) $r->uang_harian_vol);
            $b->uang_harian_satuan = $g->max(fn ($r) => (float) $r->uang_harian_satuan);
            $b->uang_harian_jumlah = $g->sum(fn ($r) => (float) $r->uang_harian_jumlah);
            $b->fullboard_vol = $g->max(fn ($r) => (float) $r->fullboard_vol);
            $b->fullboard_satuan = $g->max(fn ($r) => (float) $r->fullboard_satuan);
            $b->fullboard_jumlah = $g->sum(fn ($r) => (float) $r->fullboard_jumlah);
            $b->fullday_vol = $g->max(fn ($r) => (float) $r->fullday_vol);
            $b->fullday_satuan = $g->max(fn ($r) => (float) $r->fullday_satuan);
            $b->fullday_jumlah = $g->sum(fn ($r) => (float) $r->fullday_jumlah);
            $b->representasi = $g->sum(fn ($r) => (float) $r->representasi);
            $b->taksi_pp = $g->sum(fn ($r) => (float) $r->taksi_pp);
            $b->tiket_pesawat = $g->sum(fn ($r) => (float) $r->tiket_pesawat);
            $b->hotel = $g->sum(fn ($r) => (float) $r->hotel);
            $b->jumlah_perjadin = $b->transport + $b->uang_harian_jumlah + $b->fullboard_jumlah + $b->fullday_jumlah + $b->representasi + $b->taksi_pp + $b->tiket_pesawat + $b->hotel;
            return $b;
        })->values();
    }

    private function fillSheet(Worksheet $sheet, string $kodeAkun, $rows, string $namaItem): void
    {
        $cfg = self::CONFIG[$kodeAkun];
        $this->updateHeader($sheet, $kodeAkun, $cfg, $namaItem);
        $offset = $this->fillData($sheet, $kodeAkun, $cfg, $rows);
        $totalDiterima = $this->calculateTotalDiterima($kodeAkun, $rows);
        $this->updateFooter($sheet, $kodeAkun, $cfg, $offset, $totalDiterima);
    }

    private function calculateTotalDiterima(string $kodeAkun, $rows): float
    {
        $total = 0;
        foreach ($rows as $n) {
            if (in_array($kodeAkun, self::HONOR_AKUN)) {
                $total += (float) $n->jumlah_diterima;
            } elseif (in_array($kodeAkun, self::PERJADIN_LUAR_AKUN)) {
                $total += (float) $n->jumlah_perjadin;
            } else {
                $total += (float) $n->transport + (float) $n->uang_harian_jumlah
                       + (float) $n->fullboard_jumlah + (float) $n->fullday_jumlah
                       + (float) $n->hotel;
            }
        }
        return $total;
    }

    // ─── Update Header ────────────────────────────────────────────────────────

    private function updateHeader(Worksheet $sheet, string $kodeAkun, array $cfg, string $namaItem): void
    {
        $isHonor = in_array($kodeAkun, self::HONOR_AKUN);

        // Lampiran rows 1-3
        $colA = $isHonor ? 'A' : 'B'; // 521115 pakai A, perjadin pakai B (sesuai template)
        if ($kodeAkun === '521115' || $kodeAkun === '521213' || $kodeAkun === '522151') {
            $colA = 'A';
        } else {
            $colA = 'B';
        }

        $noSk = $this->pd->no_sk ?? 'XXX/LL3/KP.04.01';
        $tglSk = $this->pd->tgl_sk ? $this->fmtTgl($this->pd->tgl_sk) : '-';
        $noSt = $this->pd->no_st ?? 'XXXXXXXXXXXXXX';
        $tglSt = $this->pd->tgl_st ? $this->fmtTgl($this->pd->tgl_st) : '-';

        if ($isHonor) {
            $sheet->setCellValue("{$colA}3", "Nomor : {$noSk} Tgl {$tglSk}");
        } else {
            $sheet->setCellValue("{$colA}3", "Nomor : {$noSt}  Tgl {$tglSt}");
        }

        // Title row (untuk 521115: BULAN xxxx)
        if ($kodeAkun === '521115') {
            $bulan = $this->pd->tanggal_mulai
                ? strtoupper($this->fmtBulanTahun($this->pd->tanggal_mulai))
                : 'XXXX '.now()->year;
            $sheet->setCellValue("A{$cfg['subtitleRow']}", "BULAN {$bulan}");
            $sheet->setCellValue("A{$cfg['kodeAkunRow']}", "{$kodeAkun} ".($namaItem ?: 'Belanja Honor Operasional Satuan Kerja'));
        } else {
            // 521213, 522151: KEGIATAN, LINGKUNGAN, TANGGAL, kode akun
            $kegiatan = strtoupper($this->pd->keperluan ?? '');
            $sheet->setCellValue("{$colA}{$cfg['kegiatanRow']}", "KEGIATAN  {$kegiatan}");

            $tahun = $this->pd->tanggal_mulai ? substr((string) $this->pd->tanggal_mulai, 0, 4) : now()->year;
            $sheet->setCellValue("{$colA}{$cfg['lingkunganRow']}", "DI LINGKUNGAN LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III JAKARTA TAHUN ANGGARAN {$tahun}");

            $tempat = strtoupper($this->pd->tempat ?? 'JAKARTA');
            $tglPel = $this->getTglPelaksanaan();
            $sheet->setCellValue("{$colA}{$cfg['tanggalRow']}", "DI {$tempat}  TANGGAL {$tglPel}");

            // Kode akun line
            $namaAkun = match ($kodeAkun) {
                '521213' => 'Belanja Honor Output Kegiatan',
                '522151' => 'Belanja Jasa Profesi',
                '524111' => 'Belanja Perjalanan Dinas Biasa',
                '524119' => 'Belanja Perjalanan Dinas Paket Meeting Luar Kota',
                '524113' => 'Belanja Perjalanan Dinas Dalam Kota',
                '524114' => 'Belanja Perjalanan Dinas Paket Meeting Dalam Kota',
                default => '',
            };
            $sheet->setCellValue("{$colA}{$cfg['kodeAkunRow']}", "{$kodeAkun} {$namaAkun}");
        }
    }

    // ─── Fill Data ────────────────────────────────────────────────────────────

    private function fillData(Worksheet $sheet, string $kodeAkun, array $cfg, $rows): int
    {
        $dataStart = $cfg['dataStartRow'];
        $dataEnd = $cfg['dataEndRow'];
        $jumlahRow = $cfg['jumlahRow'];
        $placeholderCount = $dataEnd - $dataStart + 1;
        $actualCount = $rows->count();
        $offset = 0;

        // Clear existing placeholder data first (semua placeholder rows)
        $lastCol = $cfg['lastCol'];
        $cols = range('A', $lastCol);
        for ($r = $dataStart; $r <= $dataEnd; $r++) {
            foreach ($cols as $c) {
                $sheet->setCellValue("{$c}{$r}", null);
            }
        }

        // Insert/delete rows agar pas dengan jumlah data aktual
        // Insert SEBELUM gap row (dataEnd + 1) agar data tidak terjebak di baris gap (h=6.75)
        if ($actualCount > $placeholderCount) {
            $offset = $actualCount - $placeholderCount;
            $sheet->insertNewRowBefore($dataEnd + 1, $offset);
        } elseif ($actualCount < $placeholderCount && $actualCount > 0) {
            $offset = -($placeholderCount - $actualCount);
            // Hapus baris yang tidak terpakai
            $sheet->removeRow($dataStart + $actualCount, abs($offset));
        }

        if ($actualCount === 0) return $offset;

        // Tinggi baris data sesuai template (honor: 48, perjadin: 45)
        $rowHeight = in_array($kodeAkun, self::HONOR_AKUN) ? 48.0 : 45.0;

        // Fill data per kode akun
        $rowIdx = $dataStart;
        $no = 1;
        foreach ($rows as $nom) {
            match (true) {
                $kodeAkun === '521115' => $this->fillRow521115($sheet, $rowIdx, $no, $nom),
                $kodeAkun === '521213' => $this->fillRow521213($sheet, $rowIdx, $no, $nom),
                $kodeAkun === '522151' => $this->fillRow522151($sheet, $rowIdx, $no, $nom),
                in_array($kodeAkun, self::PERJADIN_LUAR_AKUN) => $this->fillRowPerjadinLuar($sheet, $rowIdx, $no, $nom),
                in_array($kodeAkun, self::PERJADIN_DALAM_AKUN) => $this->fillRowPerjadinDalam($sheet, $rowIdx, $no, $nom),
            };
            // Set tinggi baris konsisten dan wrap text agar nama tidak kejepit
            $sheet->getRowDimension($rowIdx)->setRowHeight($rowHeight);
            $sheet->getStyle("A{$rowIdx}:{$lastCol}{$rowIdx}")
                ->getAlignment()
                ->setWrapText(true)
                ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);
            $rowIdx++;
            $no++;
        }

        return $offset;
    }

    private function fillRow521115(Worksheet $s, int $r, int $no, $n): void
    {
        $bruto = (float) $n->jumlah_bruto;
        $s->setCellValue("A{$r}", $no);
        $s->setCellValue("B{$r}", $n->nama);
        $s->setCellValueExplicit("C{$r}", $n->nik ?? '', DataType::TYPE_STRING);
        $s->setCellValueExplicit("D{$r}", $n->npwp ?? '', DataType::TYPE_STRING);
        $s->setCellValue("E{$r}", $n->gol_ruang);
        $s->setCellValue("F{$r}", (float) $n->volume);
        $s->setCellValue("G{$r}", (float) $n->harga_satuan);
        $s->setCellValue("H{$r}", $bruto);
        $s->setCellValue("I{$r}", $bruto);
        $s->setCellValue("J{$r}", ((float) $n->pph21_persen) / 100);
        $s->getStyle("J{$r}")->getNumberFormat()->setFormatCode('0%');
        $s->setCellValue("K{$r}", (float) $n->jumlah_pajak);
        $s->setCellValue("L{$r}", (float) $n->jumlah_diterima);
        $s->setCellValue("M{$r}", $n->nama_rekening);
        $s->setCellValueExplicit("N{$r}", $n->no_rekening ?? '', DataType::TYPE_STRING);
        $s->setCellValue("O{$r}", $n->nama_bank);
        $s->setCellValue("P{$r}", $n->email);
    }

    private function fillRow521213(Worksheet $s, int $r, int $no, $n): void
    {
        $bruto = (float) $n->jumlah_bruto;
        $s->setCellValue("A{$r}", $no);
        $s->setCellValue("B{$r}", $n->nama);
        $s->setCellValue("C{$r}", $n->jabatan);
        $s->setCellValueExplicit("D{$r}", $n->nik ?? '', DataType::TYPE_STRING);
        $s->setCellValueExplicit("E{$r}", $n->npwp ?? '', DataType::TYPE_STRING);
        $s->setCellValue("F{$r}", $n->gol_ruang);
        $s->setCellValue("G{$r}", (float) $n->volume);
        $s->setCellValue("H{$r}", (float) $n->harga_satuan);
        $s->setCellValue("I{$r}", $bruto);
        $s->setCellValue("J{$r}", $bruto);
        $s->setCellValue("K{$r}", ((float) $n->pph21_persen) / 100);
        $s->getStyle("K{$r}")->getNumberFormat()->setFormatCode('0%');
        $s->setCellValue("L{$r}", (float) $n->jumlah_pajak);
        $s->setCellValue("M{$r}", (float) $n->jumlah_diterima);
        $s->setCellValue("N{$r}", $n->nama_rekening);
        $s->setCellValueExplicit("O{$r}", $n->no_rekening ?? '', DataType::TYPE_STRING);
        $s->setCellValue("P{$r}", $n->nama_bank);
        $s->setCellValue("Q{$r}", $n->email);
    }

    private function fillRow522151(Worksheet $s, int $r, int $no, $n): void
    {
        // Format sama dengan 521213 tapi label "Jml Jam"
        $this->fillRow521213($s, $r, $no, $n);
    }

    private function fillRowPerjadinLuar(Worksheet $s, int $r, int $no, $n): void
    {
        $s->setCellValue("B{$r}", $no);
        $s->setCellValue("C{$r}", $n->nama);
        $s->setCellValue("D{$r}", (float) $n->transport);
        $s->setCellValue("E{$r}", (float) $n->uang_harian_vol);
        $s->setCellValue("F{$r}", (float) $n->uang_harian_satuan);
        $s->setCellValue("G{$r}", (float) $n->uang_harian_jumlah);
        $s->setCellValue("H{$r}", (float) $n->fullboard_vol);
        $s->setCellValue("I{$r}", (float) $n->fullboard_satuan);
        $s->setCellValue("J{$r}", (float) $n->fullboard_jumlah);
        $s->setCellValue("K{$r}", (float) $n->fullday_vol);
        $s->setCellValue("L{$r}", (float) $n->fullday_satuan);
        $s->setCellValue("M{$r}", (float) $n->fullday_jumlah);
        $s->setCellValue("N{$r}", (float) $n->taksi_pp);
        $s->setCellValue("O{$r}", (float) $n->tiket_pesawat);
        $s->setCellValue("P{$r}", (float) $n->hotel);
        $s->setCellValue("Q{$r}", (float) $n->jumlah_perjadin);
        $s->setCellValue("R{$r}", $n->nama_rekening);
        $s->setCellValueExplicit("S{$r}", $n->no_rekening ?? '', DataType::TYPE_STRING);
        $s->setCellValue("T{$r}", $n->nama_bank);
        $s->setCellValue("U{$r}", $n->email);
    }

    private function fillRowPerjadinDalam(Worksheet $s, int $r, int $no, $n): void
    {
        $total = (float) $n->transport + (float) $n->uang_harian_jumlah + (float) $n->fullboard_jumlah
               + (float) $n->fullday_jumlah + (float) $n->hotel;
        $s->setCellValue("B{$r}", $no);
        $s->setCellValue("C{$r}", $n->nama);
        $s->setCellValue("D{$r}", (float) $n->transport);
        $s->setCellValue("E{$r}", (float) $n->uang_harian_vol);
        $s->setCellValue("F{$r}", (float) $n->uang_harian_satuan);
        $s->setCellValue("G{$r}", (float) $n->uang_harian_jumlah);
        $s->setCellValue("H{$r}", (float) $n->fullboard_vol);
        $s->setCellValue("I{$r}", (float) $n->fullboard_satuan);
        $s->setCellValue("J{$r}", (float) $n->fullboard_jumlah);
        $s->setCellValue("K{$r}", (float) $n->fullday_vol);
        $s->setCellValue("L{$r}", (float) $n->fullday_satuan);
        $s->setCellValue("M{$r}", (float) $n->fullday_jumlah);
        $s->setCellValue("N{$r}", (float) $n->hotel);
        $s->setCellValue("O{$r}", $total);
        $s->setCellValue("P{$r}", $n->nama_rekening);
        $s->setCellValueExplicit("Q{$r}", $n->no_rekening ?? '', DataType::TYPE_STRING);
        $s->setCellValue("R{$r}", $n->nama_bank);
        $s->setCellValue("S{$r}", $n->email);
    }

    // ─── Update Footer ────────────────────────────────────────────────────────

    private function updateFooter(Worksheet $sheet, string $kodeAkun, array $cfg, int $offset, float $totalDiterima): void
    {
        // Apply offset to all rows below data
        $jumlahRow = $cfg['jumlahRow'] + $offset;
        $terbilangRow = $cfg['terbilangRow'] + $offset;
        $jakartaRow = $cfg['jakartaRow'] + $offset;
        $ppkNameRow = $cfg['ppkNameRow'] + $offset;
        $ppkNipRow = $cfg['ppkNipRow'] + $offset;

        // Detect column A position (honor pakai A1, perjadin pakai B1)
        $colA = $sheet->getCell('A1')->getValue() === 'Lampiran :' ? 'A' : 'B';
        $jakartaCol = $cfg['jakartaCol'];

        // Terbilang — tulis ke cell pertama dari merged range yang sesuai template
        // Template merged ranges:
        // - 521115: D{row}:O{row} merged → tulis ke D
        // - 521213/522151: D='"', E:P merged → tulis '"' ke D, text ke E
        // - 524111/524119: D{row}:T{row} merged → tulis ke D
        // - 524113/524114: D{row}:R{row} merged → tulis ke D
        $terbilangText = ucwords($this->terbilang((int) $totalDiterima)).' Rupiah';

        if ($kodeAkun === '521115') {
            // Clear merged range content first, then write to merge anchor cell D
            $sheet->setCellValue("D{$terbilangRow}", '"  '.$terbilangText);
        } elseif (in_array($kodeAkun, ['521213', '522151'])) {
            // D='"', E=text (template style)
            $sheet->setCellValue("D{$terbilangRow}", '"');
            $sheet->setCellValue("E{$terbilangRow}", $terbilangText);
        } else {
            // Perjadin: D=merged with text
            $sheet->setCellValue("D{$terbilangRow}", '"  '.$terbilangText);
        }

        // Jakarta date — clear old jakarta cell at original position first
        $originalJakartaRow = $cfg['jakartaRow'];
        if ($offset !== 0) {
            // Old jakarta text might be at original row OR shifted - clear both to be safe
            $sheet->setCellValue("{$jakartaCol}{$originalJakartaRow}", null);
        }
        $sheet->setCellValue("{$jakartaCol}{$jakartaRow}", "Jakarta,    {$this->tglNominatif}");

        // PPK name & NIP — pakai snapshot dari permohonan_dana, fallback ke relasi untuk data lama
        $ppkName = $this->pd->ppk_approved_by_name ?? $this->ppk?->nama_lengkap;
        $ppkNip  = $this->pd->ppk_approved_by_nip  ?? $this->ppk?->nip  ?? $this->lookupNipFromRefNama($ppkName);

        // Bendahara name & NIP — pakai snapshot, fallback ke relasi untuk data lama
        $bendName = $this->pd->dicairkan_by_name ?? $this->bendahara?->nama_lengkap;
        $bendNip  = $this->pd->dicairkan_by_nip  ?? $this->bendahara?->nip  ?? $this->lookupNipFromRefNama($bendName);

        $sheet->setCellValue("{$colA}{$ppkNameRow}", $ppkName ?? '___________________________');
        $sheet->setCellValue("{$colA}{$ppkNipRow}", 'NIP. '.($ppkNip ?: '-'));

        $sheet->setCellValue("{$jakartaCol}{$ppkNameRow}", $bendName ?? '___________________________');
        $sheet->setCellValue("{$jakartaCol}{$ppkNipRow}", 'NIP. '.($bendNip ?: '-'));
    }

    private function lookupNipFromRefNama(?string $nama): ?string
    {
        if (! $nama) return null;
        $clean = trim(rtrim($nama, '.'));
        $ref = \App\Models\RefNama::where('nama', $clean)
            ->orWhere('nama', $nama)
            ->orWhere('nama', 'LIKE', $clean.'%')
            ->whereNotNull('nip')
            ->where('nip', '!=', '')
            ->first();
        return $ref?->nip;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function getTglPelaksanaan(): string
    {
        if (! $this->pd->tanggal_mulai || ! $this->pd->tanggal_selesai) return '';
        $m = strtoupper($this->fmtTgl($this->pd->tanggal_mulai));
        $s = strtoupper($this->fmtTgl($this->pd->tanggal_selesai));
        return $m === $s ? $m : "{$m} S.D. {$s}";
    }

    private function fmtTgl($date): string
    {
        $bulan = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        $d = is_string($date) ? new \DateTime($date) : $date;
        return $d->format('d').' '.$bulan[(int)$d->format('n')].' '.$d->format('Y');
    }

    private function fmtBulanTahun($date): string
    {
        $bulan = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        $d = is_string($date) ? new \DateTime($date) : $date;
        return $bulan[(int)$d->format('n')].' '.$d->format('Y');
    }

    private function terbilang(int $n): string
    {
        if ($n < 0) return 'minus '.$this->terbilang(abs($n));
        if ($n === 0) return 'nol';
        $s = ['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas','dua belas','tiga belas','empat belas','lima belas','enam belas','tujuh belas','delapan belas','sembilan belas'];
        if ($n < 20) return $s[$n];
        if ($n < 100) return $s[(int)($n/10)].' puluh'.($n%10 ? ' '.$s[$n%10] : '');
        if ($n < 200) return 'seratus'.($n-100 > 0 ? ' '.$this->terbilang($n-100) : '');
        if ($n < 1000) return $s[(int)($n/100)].' ratus'.($n%100 ? ' '.$this->terbilang($n%100) : '');
        if ($n < 2000) return 'seribu'.($n-1000 > 0 ? ' '.$this->terbilang($n-1000) : '');
        if ($n < 1_000_000) return $this->terbilang((int)($n/1000)).' ribu'.($n%1000 ? ' '.$this->terbilang($n%1000) : '');
        if ($n < 1_000_000_000) return $this->terbilang((int)($n/1_000_000)).' juta'.($n%1_000_000 ? ' '.$this->terbilang($n%1_000_000) : '');
        return $this->terbilang((int)($n/1_000_000_000)).' miliar'.($n%1_000_000_000 ? ' '.$this->terbilang($n%1_000_000_000) : '');
    }
}
