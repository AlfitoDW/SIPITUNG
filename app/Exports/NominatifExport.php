<?php

namespace App\Exports;

use App\Models\PermohonanDana;
use App\Models\User;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Export Daftar Nominatif menggunakan Direct-ZIP manipulation.
 * Tidak menggunakan PhpSpreadsheet untuk write — hanya untuk read metadata.
 * Struktur XML 100% original dari template.
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
        $this->pd->load(['items.nominatif', 'items.djaRincianBiaya', 'timKerja', 'djaKegiatan', 'ppkApprovedBy']);
        $this->ppk = $this->pd->ppkApprovedBy;
        $this->bendahara = User::where('role', 'bendahara')->where('is_active', true)->first();
        $this->tglNominatif = $this->pd->tgl_nominatif
            ? $this->pd->tgl_nominatif->locale('id')->isoFormat('D MMMM YYYY')
            : now()->locale('id')->isoFormat('D MMMM YYYY');
    }

    public function download(): StreamedResponse
    {
        $templatePath = storage_path('app/templates/nominatif_template_clean.xlsx');
        if (! file_exists($templatePath)) {
            abort(500, 'Template nominatif tidak ditemukan.');
        }

        $grouped = $this->pd->items->filter(fn ($i) => in_array($i->kode_akun, self::ALL_AKUN))->groupBy('kode_akun');

        // Copy template to temp file
        $tempFile = tempnam(sys_get_temp_dir(), 'nominatif_');
        copy($templatePath, $tempFile);

        // Open ZIP
        $zip = new \ZipArchive();
        $zip->open($tempFile);

        // Process each sheet
        $usedSheets = [];
        foreach ($grouped as $kodeAkun => $items) {
            $kodeAkun = (string) $kodeAkun;
            
            // Find sheet file for this kodeAkun
            $sheetFile = $this->findSheetFile($zip, $kodeAkun);
            if (! $sheetFile) continue;

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
            
            // Process sheet XML
            $this->processSheet($zip, $sheetFile, $kodeAkun, $allNominatif, $namaItem);
            
            $usedSheets[] = $kodeAkun;
        }

        // Remove unused sheets
        $this->removeUnusedSheets($zip, $usedSheets);

        // Update workbook.xml
        $this->updateWorkbook($zip, $usedSheets);

        // Update workbook rels
        $this->updateWorkbookRels($zip, $usedSheets);

        // Update Content_Types
        $this->updateContentTypes($zip, $usedSheets);

        $zip->close();

        $nomor = str_replace('/', '-', $this->pd->nomor_permohonan);
        $filename = "Nominatif_{$nomor}.xlsx";

        return response()->streamDownload(function () use ($tempFile) {
            readfile($tempFile);
            @unlink($tempFile);
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }

    /**
     * Find the sheet file for a given kodeAkun by reading workbook.xml
     */
    private function findSheetFile(\ZipArchive $zip, string $kodeAkun): ?string
    {
        $wb = $zip->getFromName('xl/workbook.xml');
        $wbXml = new \SimpleXMLElement($wb);

        foreach ($wbXml->sheets->sheet as $sheet) {
            if ((string)$sheet['name'] === $kodeAkun) {
                $rid = (string)$sheet['r:id'];
                
                // Find file from rels
                $rels = $zip->getFromName('xl/_rels/workbook.xml.rels');
                $relsXml = new \SimpleXMLElement($rels);
                
                foreach ($relsXml->Relationship as $rel) {
                    if ((string)$rel['Id'] === $rid) {
                        return 'xl/' . (string)$rel['Target'];
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Process a single sheet: replace data, update header/footer
     */
    private function processSheet(\ZipArchive $zip, string $sheetFile, string $kodeAkun, $rows, string $namaItem): void
    {
        $cfg = self::CONFIG[$kodeAkun];
        $content = $zip->getFromName($sheetFile);
        
        // Update header
        $content = $this->updateHeader($content, $kodeAkun, $cfg, $namaItem);
        
        // Replace data rows
        $content = $this->replaceDataRows($content, $kodeAkun, $cfg, $rows);
        
        // Update footer
        $totalDiterima = $this->calculateTotalDiterima($kodeAkun, $rows);
        $content = $this->updateFooter($content, $kodeAkun, $cfg, $rows->count(), $totalDiterima);
        
        // Save back to ZIP
        $zip->deleteName($sheetFile);
        $zip->addFromString($sheetFile, $content);
    }

    /**
     * Update header text in sheet XML
     */
    private function updateHeader(string $content, string $kodeAkun, array $cfg, string $namaItem): string
    {
        $isHonor = in_array($kodeAkun, self::HONOR_AKUN);
        
        $noSk = $this->pd->no_sk ?? 'XXX/LL3/KP.04.01';
        $tglSk = $this->pd->tgl_sk ? $this->fmtTgl($this->pd->tgl_sk) : '-';
        $noSt = $this->pd->no_st ?? 'XXXXXXXXXXXXXX';
        $tglSt = $this->pd->tgl_st ? $this->fmtTgl($this->pd->tgl_st) : '-';
        
        // Update row 3 (nomor)
        if ($isHonor) {
            $content = $this->updateCellValue($content, 'A3', "Nomor : {$noSk} Tgl {$tglSk}");
        } else {
            $content = $this->updateCellValue($content, 'B3', "Nomor : {$noSt}  Tgl {$tglSt}");
        }
        
        // Update kegiatan/lingkungan/tanggal
        if ($kodeAkun === '521115') {
            $bulan = $this->pd->tanggal_mulai
                ? strtoupper($this->fmtBulanTahun($this->pd->tanggal_mulai))
                : 'XXXX ' . now()->year;
            $content = $this->updateCellValue($content, "A{$cfg['subtitleRow']}", "BULAN {$bulan}");
            $content = $this->updateCellValue($content, "A{$cfg['kodeAkunRow']}", "{$kodeAkun} " . ($namaItem ?: 'Belanja Honor Operasional Satuan Kerja'));
        } else {
            $kegiatan = strtoupper($this->pd->keperluan ?? '');
            $content = $this->updateCellValue($content, "B{$cfg['kegiatanRow']}", "KEGIATAN  {$kegiatan}");
            
            $tahun = $this->pd->tanggal_mulai ? substr((string)$this->pd->tanggal_mulai, 0, 4) : now()->year;
            $content = $this->updateCellValue($content, "B{$cfg['lingkunganRow']}", "DI LINGKUNGAN LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III JAKARTA TAHUN ANGGARAN {$tahun}");
            
            $tempat = strtoupper($this->pd->tempat ?? 'JAKARTA');
            $tglPel = $this->getTglPelaksanaan();
            $content = $this->updateCellValue($content, "B{$cfg['tanggalRow']}", "DI {$tempat}  TANGGAL {$tglPel}");
            
            $namaAkun = match ($kodeAkun) {
                '521213' => 'Belanja Honor Output Kegiatan',
                '522151' => 'Belanja Jasa Profesi',
                '524111' => 'Belanja Perjalanan Dinas Biasa',
                '524119' => 'Belanja Perjalanan Dinas Paket Meeting Luar Kota',
                '524113' => 'Belanja Perjalanan Dinas Dalam Kota',
                '524114' => 'Belanja Perjalanan Dinas Paket Meeting Dalam Kota',
                default => '',
            };
            $content = $this->updateCellValue($content, "B{$cfg['kodeAkunRow']}", "{$kodeAkun} {$namaAkun}");
        }
        
        return $content;
    }

    /**
     * Replace placeholder data rows with actual data
     */
    private function replaceDataRows(string $content, string $kodeAkun, array $cfg, $rows): string
    {
        $dataStart = $cfg['dataStartRow'];
        $dataEnd = $cfg['dataEndRow'];
        $placeholderCount = $dataEnd - $dataStart + 1;
        $actualCount = $rows->count();
        
        // Extract placeholder rows
        $placeholderRows = [];
        for ($r = $dataStart; $r <= $dataEnd; $r++) {
            if (preg_match("/<row r=\"{$r}\"[^>]*>.*?<\/row>/s", $content, $m)) {
                $placeholderRows[$r] = $m[0];
            }
        }
        
        if ($actualCount === 0) {
            // Clear all placeholder rows
            foreach ($placeholderRows as $r => $rowXml) {
                $content = str_replace($rowXml, '', $content);
            }
            return $content;
        }
        
        // Build new data rows
        $newRows = [];
        $no = 1;
        foreach ($rows as $nom) {
            $rowXml = $placeholderRows[$dataStart]; // Use first placeholder as template
            $newRow = $this->fillRow($rowXml, $kodeAkun, $dataStart, $no, $nom);
            $newRows[] = $newRow;
            $no++;
        }
        
        // Replace placeholder rows with new rows
        // First, remove all placeholder rows
        foreach ($placeholderRows as $r => $rowXml) {
            $content = str_replace($rowXml, '', $content);
        }
        
        // Insert new rows after the row before dataStart
        $insertPoint = $dataStart - 1;
        // Find the row before dataStart
        if (preg_match("/<row r=\"{$insertPoint}\"[^>]*>.*?<\/row>/s", $content, $m)) {
            $insertAfter = $m[0];
            $newRowsXml = implode("\n", $newRows);
            $content = str_replace($insertAfter, $insertAfter . "\n" . $newRowsXml, $content);
        }
        
        return $content;
    }

    /**
     * Fill a single row with data
     */
    private function fillRow(string $rowXml, string $kodeAkun, int $rowNum, int $no, $nom): string
    {
        // Update row number
        $rowXml = preg_replace("/r=\"{$rowNum}\"/", 'r="' . ($rowNum) . '"', $rowXml);
        
        // Update cell references
        if ($kodeAkun === '521115') {
            $rowXml = $this->updateCellInRow($rowXml, 'A', $no);
            $rowXml = $this->updateCellInRow($rowXml, 'B', $nom->nama);
            $rowXml = $this->updateCellInRow($rowXml, 'C', $nom->nik ?? '', true);
            $rowXml = $this->updateCellInRow($rowXml, 'D', $nom->npwp ?? '', true);
            $rowXml = $this->updateCellInRow($rowXml, 'E', $nom->gol_ruang);
            $rowXml = $this->updateCellInRow($rowXml, 'F', (float) $nom->volume);
            $rowXml = $this->updateCellInRow($rowXml, 'G', (float) $nom->harga_satuan);
            $rowXml = $this->updateCellInRow($rowXml, 'H', (float) $nom->jumlah_bruto);
            $rowXml = $this->updateCellInRow($rowXml, 'I', (float) $nom->jumlah_bruto);
            $rowXml = $this->updateCellInRow($rowXml, 'J', ((float) $nom->pph21_persen) / 100);
            $rowXml = $this->updateCellInRow($rowXml, 'K', (float) $nom->jumlah_pajak);
            $rowXml = $this->updateCellInRow($rowXml, 'L', (float) $nom->jumlah_diterima);
            $rowXml = $this->updateCellInRow($rowXml, 'M', $nom->nama_rekening);
            $rowXml = $this->updateCellInRow($rowXml, 'N', $nom->no_rekening ?? '', true);
            $rowXml = $this->updateCellInRow($rowXml, 'O', $nom->nama_bank);
            $rowXml = $this->updateCellInRow($rowXml, 'P', $nom->email);
        } elseif ($kodeAkun === '521213' || $kodeAkun === '522151') {
            $rowXml = $this->updateCellInRow($rowXml, 'A', $no);
            $rowXml = $this->updateCellInRow($rowXml, 'B', $nom->nama);
            $rowXml = $this->updateCellInRow($rowXml, 'C', $nom->jabatan);
            $rowXml = $this->updateCellInRow($rowXml, 'D', $nom->nik ?? '', true);
            $rowXml = $this->updateCellInRow($rowXml, 'E', $nom->npwp ?? '', true);
            $rowXml = $this->updateCellInRow($rowXml, 'F', $nom->gol_ruang);
            $rowXml = $this->updateCellInRow($rowXml, 'G', (float) $nom->volume);
            $rowXml = $this->updateCellInRow($rowXml, 'H', (float) $nom->harga_satuan);
            $rowXml = $this->updateCellInRow($rowXml, 'I', (float) $nom->jumlah_bruto);
            $rowXml = $this->updateCellInRow($rowXml, 'J', (float) $nom->jumlah_bruto);
            $rowXml = $this->updateCellInRow($rowXml, 'K', ((float) $nom->pph21_persen) / 100);
            $rowXml = $this->updateCellInRow($rowXml, 'L', (float) $nom->jumlah_pajak);
            $rowXml = $this->updateCellInRow($rowXml, 'M', (float) $nom->jumlah_diterima);
            $rowXml = $this->updateCellInRow($rowXml, 'N', $nom->nama_rekening);
            $rowXml = $this->updateCellInRow($rowXml, 'O', $nom->no_rekening ?? '', true);
            $rowXml = $this->updateCellInRow($rowXml, 'P', $nom->nama_bank);
            $rowXml = $this->updateCellInRow($rowXml, 'Q', $nom->email);
        } elseif (in_array($kodeAkun, self::PERJADIN_LUAR_AKUN)) {
            $rowXml = $this->updateCellInRow($rowXml, 'B', $no);
            $rowXml = $this->updateCellInRow($rowXml, 'C', $nom->nama);
            $rowXml = $this->updateCellInRow($rowXml, 'D', (float) $nom->transport);
            $rowXml = $this->updateCellInRow($rowXml, 'E', (float) $nom->uang_harian_vol);
            $rowXml = $this->updateCellInRow($rowXml, 'F', (float) $nom->uang_harian_satuan);
            $rowXml = $this->updateCellInRow($rowXml, 'G', (float) $nom->uang_harian_jumlah);
            $rowXml = $this->updateCellInRow($rowXml, 'H', (float) $nom->fullboard_vol);
            $rowXml = $this->updateCellInRow($rowXml, 'I', (float) $nom->fullboard_satuan);
            $rowXml = $this->updateCellInRow($rowXml, 'J', (float) $nom->fullboard_jumlah);
            $rowXml = $this->updateCellInRow($rowXml, 'K', (float) $nom->fullday_vol);
            $rowXml = $this->updateCellInRow($rowXml, 'L', (float) $nom->fullday_satuan);
            $rowXml = $this->updateCellInRow($rowXml, 'M', (float) $nom->fullday_jumlah);
            $rowXml = $this->updateCellInRow($rowXml, 'N', (float) $nom->taksi_pp);
            $rowXml = $this->updateCellInRow($rowXml, 'O', (float) $nom->tiket_pesawat);
            $rowXml = $this->updateCellInRow($rowXml, 'P', (float) $nom->hotel);
            $rowXml = $this->updateCellInRow($rowXml, 'Q', (float) $nom->jumlah_perjadin);
            $rowXml = $this->updateCellInRow($rowXml, 'R', $nom->nama_rekening);
            $rowXml = $this->updateCellInRow($rowXml, 'S', $nom->no_rekening ?? '', true);
            $rowXml = $this->updateCellInRow($rowXml, 'T', $nom->nama_bank);
            $rowXml = $this->updateCellInRow($rowXml, 'U', $nom->email);
        } elseif (in_array($kodeAkun, self::PERJADIN_DALAM_AKUN)) {
            $total = (float) $nom->transport + (float) $nom->uang_harian_jumlah + (float) $nom->fullboard_jumlah
                   + (float) $nom->fullday_jumlah + (float) $nom->hotel;
            $rowXml = $this->updateCellInRow($rowXml, 'B', $no);
            $rowXml = $this->updateCellInRow($rowXml, 'C', $nom->nama);
            $rowXml = $this->updateCellInRow($rowXml, 'D', (float) $nom->transport);
            $rowXml = $this->updateCellInRow($rowXml, 'E', (float) $nom->uang_harian_vol);
            $rowXml = $this->updateCellInRow($rowXml, 'F', (float) $nom->uang_harian_satuan);
            $rowXml = $this->updateCellInRow($rowXml, 'G', (float) $nom->uang_harian_jumlah);
            $rowXml = $this->updateCellInRow($rowXml, 'H', (float) $nom->fullboard_vol);
            $rowXml = $this->updateCellInRow($rowXml, 'I', (float) $nom->fullboard_satuan);
            $rowXml = $this->updateCellInRow($rowXml, 'J', (float) $nom->fullboard_jumlah);
            $rowXml = $this->updateCellInRow($rowXml, 'K', (float) $nom->fullday_vol);
            $rowXml = $this->updateCellInRow($rowXml, 'L', (float) $nom->fullday_satuan);
            $rowXml = $this->updateCellInRow($rowXml, 'M', (float) $nom->fullday_jumlah);
            $rowXml = $this->updateCellInRow($rowXml, 'N', (float) $nom->hotel);
            $rowXml = $this->updateCellInRow($rowXml, 'O', $total);
            $rowXml = $this->updateCellInRow($rowXml, 'P', $nom->nama_rekening);
            $rowXml = $this->updateCellInRow($rowXml, 'Q', $nom->no_rekening ?? '', true);
            $rowXml = $this->updateCellInRow($rowXml, 'R', $nom->nama_bank);
            $rowXml = $this->updateCellInRow($rowXml, 'S', $nom->email);
        }
        
        return $rowXml;
    }

    /**
     * Update a single cell in a row XML
     */
    private function updateCellInRow(string $rowXml, string $col, $value, bool $isString = false): string
    {
        // Find cell in row
        $pattern = '/<c r="' . $col . '\d+"[^>]*>.*?<\/c>/s';
        if (preg_match($pattern, $rowXml, $m)) {
            $cellXml = $m[0];
            
            // Determine value type
            if (is_numeric($value) && !$isString) {
                // Number value
                $newCell = preg_replace('/<v>[^<]*<\/v>/', '<v>' . $value . '</v>', $cellXml);
                if ($newCell === $cellXml) {
                    // No <v> tag found, add one
                    $newCell = preg_replace('/<\/c>/', '<v>' . $value . '</v></c>', $cellXml);
                }
            } else {
                // String value
                $newCell = preg_replace('/<v>[^<]*<\/v>/', '<v>' . htmlspecialchars($value) . '</v>', $cellXml);
                if ($newCell === $cellXml) {
                    $newCell = preg_replace('/<\/c>/', '<v>' . htmlspecialchars($value) . '</v></c>', $cellXml);
                }
                // Ensure type="s" for strings
                if (!str_contains($newCell, 't="s"')) {
                    $newCell = str_replace('<c ', '<c t="s" ', $newCell);
                }
            }
            
            $rowXml = str_replace($cellXml, $newCell, $rowXml);
        }
        
        return $rowXml;
    }

    /**
     * Update a cell value in sheet XML
     */
    private function updateCellValue(string $content, string $cellRef, string $value): string
    {
        $pattern = '/<c r="' . $cellRef . '"[^>]*>.*?<\/c>/s';
        if (preg_match($pattern, $content, $m)) {
            $cellXml = $m[0];
            $newCell = preg_replace('/<v>[^<]*<\/v>/', '<v>' . htmlspecialchars($value) . '</v>', $cellXml);
            if ($newCell === $cellXml) {
                $newCell = preg_replace('/<\/c>/', '<v>' . htmlspecialchars($value) . '</v></c>', $cellXml);
            }
            if (!str_contains($newCell, 't="s"')) {
                $newCell = str_replace('<c ', '<c t="s" ', $newCell);
            }
            $content = str_replace($cellXml, $newCell, $content);
        }
        return $content;
    }

    /**
     * Update footer: jumlah, terbilang, ttd, NIP
     */
    private function updateFooter(string $content, string $kodeAkun, array $cfg, int $actualCount, float $totalDiterima): string
    {
        $offset = $actualCount - ($cfg['dataEndRow'] - $cfg['dataStartRow'] + 1);
        
        $jumlahRow = $cfg['jumlahRow'] + $offset;
        $terbilangRow = $cfg['terbilangRow'] + $offset;
        $jakartaRow = $cfg['jakartaRow'] + $offset;
        $ppkNameRow = $cfg['ppkNameRow'] + $offset;
        $ppkNipRow = $cfg['ppkNipRow'] + $offset;
        
        $jakartaCol = $cfg['jakartaCol'];
        
        // Terbilang
        $terbilangText = ucwords($this->terbilang((int) $totalDiterima)).' Rupiah';
        
        if ($kodeAkun === '521115') {
            $content = $this->updateCellValue($content, "D{$terbilangRow}", '"  '.$terbilangText);
        } elseif (in_array($kodeAkun, ['521213', '522151'])) {
            $content = $this->updateCellValue($content, "D{$terbilangRow}", '"');
            $content = $this->updateCellValue($content, "E{$terbilangRow}", $terbilangText);
        } else {
            $content = $this->updateCellValue($content, "D{$terbilangRow}", '"  '.$terbilangText);
        }
        
        // Jakarta date
        $content = $this->updateCellValue($content, "{$jakartaCol}{$jakartaRow}", "Jakarta,    {$this->tglNominatif}");
        
        // PPK
        $activePpk = User::where('role', 'pimpinan')
            ->where('pimpinan_type', 'ppk')
            ->where('is_active', true)
            ->first();
        $ppk = $activePpk ?: $this->ppk;
        
        $ppkNip = $ppk?->nip ?: $this->lookupNipFromRefNama($ppk?->nama_lengkap);
        $bendNip = $this->bendahara?->nip ?: $this->lookupNipFromRefNama($this->bendahara?->nama_lengkap);
        
        // Determine column A position
        $isHonor = in_array($kodeAkun, self::HONOR_AKUN);
        $colA = $isHonor ? 'A' : 'B';
        
        $content = $this->updateCellValue($content, "{$colA}{$ppkNameRow}", $ppk?->nama_lengkap ?? '___________________________');
        $content = $this->updateCellValue($content, "{$colA}{$ppkNipRow}", 'NIP. '.($ppkNip ?: '-'));
        
        $content = $this->updateCellValue($content, "{$jakartaCol}{$ppkNameRow}", $this->bendahara?->nama_lengkap ?? '___________________________');
        $content = $this->updateCellValue($content, "{$jakartaCol}{$ppkNipRow}", 'NIP. '.($bendNip ?: '-'));
        
        return $content;
    }

    /**
     * Remove unused sheets and reindex remaining sheets to sheet1, sheet2, etc.
     */
    private function removeUnusedSheets(\ZipArchive $zip, array $usedSheets): void
    {
        $wb = $zip->getFromName('xl/workbook.xml');
        $wbXml = new \SimpleXMLElement($wb);
        
        // Map sheet names to their original file paths
        $sheetMap = [];
        foreach ($wbXml->sheets->sheet as $sheet) {
            $name = (string)$sheet['name'];
            $rid = (string)$sheet['r:id'];
            
            $rels = $zip->getFromName('xl/_rels/workbook.xml.rels');
            $relsXml = new \SimpleXMLElement($rels);
            
            foreach ($relsXml->Relationship as $rel) {
                if ((string)$rel['Id'] === $rid) {
                    $sheetMap[$name] = [
                        'target' => (string)$rel['Target'],
                        'rid' => $rid,
                    ];
                    break;
                }
            }
        }
        
        // Delete unused sheets and rels
        foreach ($sheetMap as $name => $info) {
            if (!in_array($name, $usedSheets)) {
                $zip->deleteName('xl/' . $info['target']);
                $zip->deleteName('xl/worksheets/_rels/' . basename($info['target']) . '.rels');
            }
        }
        
        // Rename remaining sheets to sheet1, sheet2, etc.
        $newIndex = 1;
        foreach ($usedSheets as $name) {
            if (isset($sheetMap[$name])) {
                $oldPath = 'xl/' . $sheetMap[$name]['target'];
                $newPath = 'xl/worksheets/sheet' . $newIndex . '.xml';
                
                if ($oldPath !== $newPath) {
                    // Copy content to new path
                    $content = $zip->getFromName($oldPath);
                    $zip->addFromString($newPath, $content);
                    $zip->deleteName($oldPath);
                    
                    // Also rename rels file
                    $oldRels = 'xl/worksheets/_rels/' . basename($sheetMap[$name]['target']) . '.rels';
                    $newRels = 'xl/worksheets/_rels/sheet' . $newIndex . '.xml.rels';
                    if ($zip->locateName($oldRels) !== false) {
                        $relsContent = $zip->getFromName($oldRels);
                        $zip->addFromString($newRels, $relsContent);
                        $zip->deleteName($oldRels);
                    }
                    
                    // Update sheetMap
                    $sheetMap[$name]['newTarget'] = 'worksheets/sheet' . $newIndex . '.xml';
                } else {
                    $sheetMap[$name]['newTarget'] = $sheetMap[$name]['target'];
                }
                $newIndex++;
            }
        }
        
        // Update workbook.xml
        $wbXml->sheets = '';
        $newSheets = $wbXml->addChild('sheets');
        $sheetId = 1;
        foreach ($usedSheets as $name) {
            $sheet = $newSheets->addChild('sheet');
            $sheet['name'] = $name;
            $sheet['sheetId'] = $sheetId;
            $sheet['r:id'] = 'rId' . ($sheetId + 3);
            $sheetId++;
        }
        
        $zip->deleteName('xl/workbook.xml');
        $zip->addFromString('xl/workbook.xml', $wbXml->asXML());
        
        // Update workbook rels
        $newRels = new \SimpleXMLElement('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
        
        $rid = 1;
        
        $rel = $newRels->addChild('Relationship');
        $rel['Id'] = 'rId' . $rid;
        $rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles';
        $rel['Target'] = 'styles.xml';
        $rid++;
        
        $rel = $newRels->addChild('Relationship');
        $rel['Id'] = 'rId' . $rid;
        $rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme';
        $rel['Target'] = 'theme/theme1.xml';
        $rid++;
        
        $rel = $newRels->addChild('Relationship');
        $rel['Id'] = 'rId' . $rid;
        $rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings';
        $rel['Target'] = 'sharedStrings.xml';
        $rid++;
        
        foreach ($usedSheets as $name) {
            $rel = $newRels->addChild('Relationship');
            $rel['Id'] = 'rId' . $rid;
            $rel['Type'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet';
            $rel['Target'] = $sheetMap[$name]['newTarget'] ?? 'worksheets/sheet' . ($rid - 3) . '.xml';
            $rid++;
        }
        
        $zip->deleteName('xl/_rels/workbook.xml.rels');
        $zip->addFromString('xl/_rels/workbook.xml.rels', $newRels->asXML());
        
        // Update Content_Types
        $ct = $zip->getFromName('[Content_Types].xml');
        $ctXml = new \SimpleXMLElement($ct);
        
        $overrides = $ctXml->Override;
        for ($i = count($overrides) - 1; $i >= 0; $i--) {
            $partName = (string)$overrides[$i]['PartName'];
            if (preg_match('/xl\/worksheets\/sheet\d+\.xml/', $partName)) {
                $sheetNum = (int)preg_replace('/.*sheet(\d+)\.xml/', '$1', $partName);
                if ($sheetNum > count($usedSheets)) {
                    unset($overrides[$i][0]);
                }
            }
        }
        
        $zip->deleteName('[Content_Types].xml');
        $zip->addFromString('[Content_Types].xml', $ctXml->asXML());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

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
