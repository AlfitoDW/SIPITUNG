<?php

namespace App\Exports;

use App\Models\PermohonanDana;
use App\Models\User;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PermohonanDanaExport
{
    private PermohonanDana $pd;

    private array $sectionRowMap = []; // Track Sheet 2 section row positions

    private const DOK_CHECK_MAP = [
        1 => 'Rincian Kebutuhan Biaya',
        2 => 'Surat Keputusan Pelaksanaan Kegiatan',
        3 => 'Surat Tugas Kepanitian',
        4 => 'Surat Undangan Kegiatan',
        5 => 'Surat Pernyataan Kegiatan Luar Kantor',
        6 => 'Kuitansi / Bukti Pembayaran',
        7 => 'SPK / Surat Perjanjian',
        8 => 'Dokumen Lainnya',
    ];

    public function __construct(PermohonanDana $pd)
    {
        $this->pd = $pd;
        $this->pd->load([
            'items.nominatif', 'dokumens',
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'ppkApprovedBy',
        ]);
    }

    public function download(): \Illuminate\Http\Response
    {
        $templatePath = storage_path('app/templates/permohonan_dana_template.xlsx');
        if (! file_exists($templatePath)) {
            abort(500, 'Template permohonan dana tidak ditemukan.');
        }

        $spreadsheet = IOFactory::load($templatePath);

        // IMPORTANT: Populate Sheet 2 FIRST to get section row positions for formula references
        $sheet2 = $spreadsheet->getSheet(1);
        if ($sheet2) {
            $this->populateSheet2($sheet2);
        }

        // Then populate Sheet 1 with formula references to Sheet 2
        $sheet1 = $spreadsheet->getSheet(0);
        if ($sheet1) {
            $this->populateSheet1($sheet1);
        }

        $nomor = str_replace('/', '-', $this->pd->nomor_permohonan);
        $filename = "Surat_Permohonan_Dana_{$nomor}.xlsx";

        $tempFile = tempnam(sys_get_temp_dir(), 'spd_');
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save($tempFile);

        $content = file_get_contents($tempFile);
        unlink($tempFile);

        return response($content, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }

    // ============================================================================
    // SHEET 1: PERMOHONAN DANA
    // ============================================================================

    private function populateSheet1(Worksheet $sheet): void
    {
        $dja = $this->pd->djaDisplayPayload();

        // Field labels (Column A & C) and values (Column D) - rows 5-15
        $sheet->setCellValue('A5', '1.');
        $sheet->setCellValue('C5', ':');
        $sheet->setCellValue('D5', '693205 Lembaga Layanan Pendidikan Tinggi Wilayah III');

        $sheet->setCellValue('A6', '2.');
        $sheet->setCellValue('C6', ':');
        $sheet->setCellValue('D6', $dja['dja_program']['nama'] ?? '');

        $sheet->setCellValue('A7', '3.');
        $sheet->setCellValue('C7', ':');
        $sheet->setCellValue('D7', $dja['dja_sasaran']['nama'] ?? '');

        $sheet->setCellValue('A9', '4.');
        $sheet->setCellValue('C9', ':');
        $sheet->setCellValue('D9', $dja['dja_kro']['nama'] ?? '');

        $sheet->setCellValue('A10', '5.');
        $sheet->setCellValue('C10', ':');
        $sheet->setCellValue('D10', $dja['dja_ro']['nama'] ?? '');

        $sheet->setCellValue('A11', '6.');
        $sheet->setCellValue('C11', ':');
        $sheet->setCellValue('D11', $dja['dja_komponen']['nama'] ?? '-');

        // Kegiatan (row 12) - use judul_pekerjaan from wizard
        $sheet->setCellValue('A12', '7.');
        $sheet->setCellValue('C12', ':');
        $sheet->setCellValue('D12', $this->pd->judul_pekerjaan ?? '');

        // IKU (row 13)
        $sheet->setCellValue('A13', '8.');
        $sheet->setCellValue('C13', ':');
        $sheet->setCellValue('D13', '');

        // Waktu (row 14)
        $sheet->setCellValue('A14', '9.');
        $sheet->setCellValue('C14', ':');
        $sheet->setCellValue('D14', $this->getWaktuPelaksanaan());

        // Tempat (row 15) - use actual tempat, not judul_pekerjaan
        $sheet->setCellValue('A15', '10.');
        $sheet->setCellValue('C15', ':');
        $sheet->setCellValue('D15', $this->pd->tempat ?: 'JAKARTA');

        // Label for Kebutuhan Biaya section (row 19)
        $sheet->setCellValue('A19', '11.');

        // Document checklist numbers (rows 27-34)
        for ($i = 1; $i <= 8; $i++) {
            $sheet->setCellValue('A'.(26 + $i), $i.'.');
        }

        // Kebutuhan Biaya (rows 16-23) - must be called after Sheet 2 is populated
        $this->populateKebutuhanBiaya($sheet);

        // Signatures (rows 39, 44-46)
        $this->populateSignatures($sheet);
    }

    private function getWaktuPelaksanaan(): string
    {
        if (! $this->pd->tanggal_mulai) {
            return '';
        }

        return $this->fmtTgl($this->pd->tanggal_mulai);
    }

    private function populateKebutuhanBiaya(Worksheet $sheet): void
    {
        $items = $this->pd->items;
        $startRow = 16;
        $grandTotal = 0;

        // Clear rows 16-23 first to remove template formulas/data that cause #REF!
        for ($row = 16; $row <= 23; $row++) {
            $sheet->setCellValue("D{$row}", '');
            $sheet->setCellValue("E{$row}", '');
            $sheet->setCellValue("H{$row}", '');
        }

        foreach ($items as $idx => $item) {
            if ($idx >= 8) {
                break; // Max 8 items (rows 16-23)
            }

            $row = $startRow + $idx;
            $sheet->setCellValue("D{$row}", '11.'.($idx + 1));

            // Use direct value (formula reference to Sheet 2 caused #REF! errors)
            $sheet->setCellValue("E{$row}", $item->uraian ?: 'Item '.($idx + 1));

            $sheet->setCellValue("H{$row}", (float) ($item->total ?? 0)); // Numeric only

            $grandTotal += (float) ($item->total ?? 0);
        }

        // Grand total row (row 24) - match IPTI structure
        $sheet->setCellValue('E24', 'Jumlah');
        $sheet->setCellValue('H24', $grandTotal);
    }

    private function populateSignatures(Worksheet $sheet): void
    {
        // Date (row 39, column H) - "Jakarta, 8 Juni 2026"
        $tglSurat = $this->pd->created_at
            ? $this->pd->created_at->locale('id')->isoFormat('D MMMM YYYY')
            : now()->locale('id')->isoFormat('D MMMM YYYY');
        $sheet->setCellValue('H39', 'Jakarta, '.$tglSurat);

        // PPK: use snapshot first, fallback to active PPK
        $ppkName = $this->pd->ppk_approved_by_name;
        $ppkNip = $this->pd->ppk_approved_by_nip;

        if (! $ppkName) {
            $activePpk = User::where('role', 'pimpinan')
                ->where('pimpinan_type', 'ppk')
                ->where('is_active', true)
                ->first();
            $ppkName = $activePpk?->nama_lengkap;
            $ppkNip = $activePpk?->nip;
        }

        // Fallback: if PPK NIP still empty, get from active PPK
        if (! $ppkNip) {
            $activePpk = User::where('role', 'pimpinan')
                ->where('pimpinan_type', 'ppk')
                ->where('is_active', true)
                ->first();
            $ppkNip = $activePpk?->nip;
        }

        // Pemohon: use snapshot (creator)
        $pemohonName = $this->pd->created_by_name;
        $pemohonNip = $this->pd->created_by_nip;

        // Fallback: if pemohon NIP empty, get from creator user
        if (! $pemohonNip && $this->pd->created_by) {
            $creator = User::find($this->pd->created_by);
            $pemohonNip = $creator?->nip;
        }

        // PPK signature (left side - column B)
        $sheet->setCellValue('B44', $ppkName ?: '___________________________');
        $sheet->setCellValue('B45', $ppkNip ? 'NIP. '.$ppkNip : 'NIP. -');

        // Pemohon signature (right side - column H)
        $sheet->setCellValue('H45', $pemohonName ?: '___________________________');
        $sheet->setCellValue('H46', $pemohonNip ? 'NIP. '.$pemohonNip : 'NIP. -');
    }

    // ============================================================================
    // SHEET 2: RINCIAN ANGGARAN BIAYA
    // ============================================================================

    private function populateSheet2(Worksheet $sheet): void
    {
        // Clear template sections before writing header/title so title is not wiped.
        $this->clearSheetTwoContent($sheet);

        // Set "RINCIAN ANGGARAN BIAYA" header in row 1
        $this->setSheet2Header($sheet);

        // Fill the title (row 2, column B - merged B2:M2 in template)
        $judul = $this->pd->judul_pekerjaan ?: $this->pd->keperluan ?: '';

        // Check if title has "dengan tema" to split into 2 lines (like IPTI)
        if (stripos($judul, 'dengan tema') !== false) {
            $parts = preg_split('/dengan tema/i', $judul, 2);
            $sheet->setCellValue('B2', trim($parts[0]));
            if (isset($parts[1])) {
                $sheet->setCellValue('B3', 'dengan tema'.$parts[1]);
            }
        } else {
            $sheet->setCellValue('B2', $judul);
        }

        // Merge and style judul pekerjaan cells
        $sheet->mergeCells('B2:M2');
        $sheet->getStyle('B2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 11],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
        ]);

        // If row 3 has "dengan tema" part, also merge and style it
        if (stripos($judul, 'dengan tema') !== false) {
            $sheet->mergeCells('B3:M3');
            $sheet->getStyle('B3')->applyFromArray([
                'font' => ['size' => 11],
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                    'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                ],
            ]);
        }

        // Set column widths to match IPTI template exactly
        $sheet->getColumnDimension('A')->setWidth(3.875);
        $sheet->getColumnDimension('B')->setWidth(26);
        $sheet->getColumnDimension('C')->setWidth(16.625);
        $sheet->getColumnDimension('D')->setWidth(19.125);
        $sheet->getColumnDimension('E')->setWidth(19.375);
        $sheet->getColumnDimension('F')->setWidth(18.125);
        $sheet->getColumnDimension('G')->setWidth(24.25);
        $sheet->getColumnDimension('H')->setWidth(14.75);
        $sheet->getColumnDimension('I')->setWidth(14);
        $sheet->getColumnDimension('J')->setWidth(5);
        $sheet->getColumnDimension('K')->setWidth(10.625);
        $sheet->getColumnDimension('L')->setWidth(12.875);
        $sheet->getColumnDimension('M')->setWidth(14);

        // Build sections from items (starting from row 5)
        $items = $this->pd->items;

        // Sort: perjadin/honor first (priority 0), others last (priority 1)
        $sortedItems = $items->sortBy(function ($item) {
            return ($item->isHonor() || $item->isPerjadin()) ? 0 : 1;
        })->values();

        $currentRow = 5;
        $sectionLetters = range('A', 'Z');

        foreach ($sortedItems as $idx => $item) {
            // Store section header row position for Sheet 1 formula references
            $this->sectionRowMap[$idx] = $currentRow;

            $sectionLabel = $sectionLetters[$idx].'.';
            $sectionName = $item->uraian ?: 'Item '.($idx + 1);
            $hasNominatif = $item->nominatif->isNotEmpty();

            if ($hasNominatif) {
                // Has nominatif data (person details) - use full nominatif format
                $currentRow = $this->writeNominatifSection($sheet, $currentRow, $sectionLabel, $sectionName, $item);
            } else {
                // No nominatif data
                if ($item->isHonor() || $item->isPerjadin()) {
                    // Perjadin/Honor without nominatif - use standard non-nominatif format
                    $currentRow = $this->writeNonNominatifSection($sheet, $currentRow, $sectionLabel, $sectionName, $item);
                } else {
                    // Other items (belanja bahan, etc.) - use simpler format
                    $currentRow = $this->writeSimpleNonNominatifSection($sheet, $currentRow, $sectionLabel, $sectionName, $item);
                }
            }

            $currentRow += 1; // one blank row between sections
        }

        // Set print area
        $lastCol = 'M';
        $lastRow = $currentRow - 1;
        $sheet->getPageSetup()->setPrintArea("A1:{$lastCol}{$lastRow}");
    }

    private function setSheet2Header(Worksheet $sheet): void
    {
        // Row 1: "RINCIAN ANGGARAN BIAYA" header with styling
        $sheet->mergeCells('A1:M1');
        $sheet->setCellValue('A1', 'RINCIAN ANGGARAN BIAYA');

        // Styling for header
        $sheet->getStyle('A1')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 14,
                'color' => ['rgb' => '000000'], // black text
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
            ],
            'fill' => [
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'D9D9D9'], // gray background
            ],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(25);
    }

    private function clearSheetTwoContent(Worksheet $sheet): void
    {
        $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($sheet->getHighestColumn());
        $lastColumnIndex = max($highestColumnIndex, 13);

        // Clear rows 2-3 only (row 1 will have header)
        for ($row = 2; $row <= 3; $row++) {
            for ($colIndex = 1; $colIndex <= $lastColumnIndex; $colIndex++) {
                $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex);
                $sheet->setCellValue("{$col}{$row}", '');
            }
        }

        // Collect merge ranges first to avoid modification during iteration
        $mergeCells = $sheet->getMergeCells();
        foreach ($mergeCells as $range => $_) {
            [$start, $end] = explode(':', $range);
            $startRow = (int) filter_var($start, FILTER_SANITIZE_NUMBER_INT);
            $startCol = preg_replace('/\d+/', '', $start);
            $startColIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($startCol);

            if ($startRow >= 4 || $startColIndex > 13) {
                $sheet->unmergeCells($range);
            }
        }

        // Clear everything from row 4 onwards, including template fill/styles that can bleed into new tables.
        $lastRow = $sheet->getHighestDataRow();
        for ($row = 1; $row <= $lastRow; $row++) {
            $firstColIndex = $row >= 4 ? 1 : 14;

            for ($colIndex = $firstColIndex; $colIndex <= $lastColumnIndex; $colIndex++) {
                $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex);
                $sheet->setCellValue("{$col}{$row}", '');
                $style = $sheet->getStyle("{$col}{$row}");
                $style->getBorders()->getAllBorders()->setBorderStyle(
                    \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_NONE
                );
                $style->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_NONE);
                $style->getFont()->setBold(false)->setItalic(false)->setUnderline(false);
                $style->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_GENERAL);
                $style->getAlignment()->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_BOTTOM);
            }
        }
    }

    private function writeNominatifSection(Worksheet $sheet, int $startRow, string $label, string $name, $item): int
    {
        // Section header - match IPTI format
        $sheet->mergeCells("B{$startRow}:K{$startRow}");
        $sheet->setCellValue("A{$startRow}", $label);
        $sheet->setCellValue("B{$startRow}", $name);
        $sheet->getStyle("A{$startRow}")->getFont()->setBold(true);
        $sheet->getStyle("B{$startRow}")->getFont()->setBold(true);
        $sheet->getRowDimension($startRow)->setRowHeight(22);

        // Table headers
        $headerRow = $startRow + 1;
        $headers = ['No', 'Nama Pegawai', 'Jabatan dalam Tugas', 'NIK', 'NPWP',
            'No. Rekening', 'Nama Rekening', 'Nama Bank', 'Email',
            'Vol', 'Satuan', 'Biaya Satuan', 'Total'];

        foreach ($headers as $colIdx => $h) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $cell = $sheet->getCell("{$col}{$headerRow}");
            $cell->setValue($h);
            $cell->getStyle()->getFont()->setBold(true)->setSize(10);
            $cell->getStyle()->getAlignment()->setHorizontal('center')->setVertical('center')->setWrapText(true);

            // Add gray background to header cells
            $cell->getStyle()->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D9D9D9');

            $this->thinBorder($sheet, "{$col}{$headerRow}");
        }
        $sheet->getRowDimension($headerRow)->setRowHeight(30);

        // Data rows
        $dataRow = $headerRow + 1;
        $firstDataRow = $dataRow;
        $no = 1;

        foreach ($item->nominatif as $nom) {
            $this->writeNominatifRow($sheet, $dataRow, $no, $nom);
            $dataRow++;
            $no++;
        }

        $lastDataRow = $dataRow - 1;

        // Jumlah row with SUM formula (like IPTI template)
        $this->writeJumlahRow($sheet, $dataRow, $firstDataRow, $lastDataRow);
        $dataRow++;

        return $dataRow;
    }

    private function writeNominatifRow(Worksheet $sheet, int $row, int $no, $nom): void
    {
        $sheet->setCellValue("A{$row}", $no);
        $sheet->setCellValue("B{$row}", $nom->nama);
        $sheet->setCellValue("C{$row}", $nom->jabatan ?? '-');
        $this->setTextCell($sheet, "D{$row}", $nom->nik);
        $this->setTextCell($sheet, "E{$row}", $nom->npwp);
        $this->setTextCell($sheet, "F{$row}", $nom->no_rekening);
        $sheet->setCellValue("G{$row}", $nom->nama_rekening);
        $sheet->setCellValue("H{$row}", $nom->nama_bank);
        $sheet->setCellValue("I{$row}", $nom->email);
        $sheet->setCellValue("J{$row}", (float) $nom->volume);
        $sheet->setCellValue("K{$row}", 'OJ'); // satuan
        $sheet->setCellValue("L{$row}", (float) $nom->harga_satuan);
        $sheet->setCellValue("M{$row}", (float) $nom->jumlah_bruto);

        $sheet->getRowDimension($row)->setRowHeight(22);
        for ($col = 'A'; $col <= 'M'; $col++) {
            $this->thinBorder($sheet, "{$col}{$row}");
        }
    }

    private function writeNonNominatifSection(Worksheet $sheet, int $startRow, string $label, string $name, $item): int
    {
        // Section header - match IPTI format
        $sheet->mergeCells("B{$startRow}:K{$startRow}");
        $sheet->setCellValue("A{$startRow}", $label);
        $sheet->setCellValue("B{$startRow}", $name);
        $sheet->getStyle("A{$startRow}")->getFont()->setBold(true);
        $sheet->getStyle("B{$startRow}")->getFont()->setBold(true);
        $sheet->getRowDimension($startRow)->setRowHeight(22);

        // Table headers (merged middle columns)
        $headerRow = $startRow + 1;
        $headerData = [
            'A' => 'No',
            'B' => 'Jenis Belanja',
            'J' => 'Vol',
            'K' => 'Satuan',
            'L' => 'Biaya Satuan',
            'M' => 'Total',
        ];

        foreach ($headerData as $col => $h) {
            $cell = $sheet->getCell("{$col}{$headerRow}");
            $cell->setValue($h);
            $cell->getStyle()->getFont()->setBold(true)->setSize(10);
            $cell->getStyle()->getAlignment()->setHorizontal('center')->setVertical('center');

            // Add gray background to header cells
            $cell->getStyle()->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D9D9D9');

            $this->thinBorder($sheet, "{$col}{$headerRow}");
        }

        // Merge middle columns C-I for the header
        $sheet->mergeCells("C{$headerRow}:I{$headerRow}");
        for ($c = 'C'; $c <= 'I'; $c++) {
            $this->thinBorder($sheet, "{$c}{$headerRow}");
        }

        // Apply gray background to merged middle columns header
        $sheet->getStyle("C{$headerRow}:I{$headerRow}")->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setRGB('D9D9D9');
        $sheet->getRowDimension($headerRow)->setRowHeight(24);

        // Data row - just the item itself (no nominatif detail rows)
        $dataRow = $headerRow + 1;
        $sheet->setCellValue("A{$dataRow}", 1);
        $sheet->setCellValue("B{$dataRow}", $item->uraian ?: 'Item');
        $sheet->mergeCells("C{$dataRow}:I{$dataRow}");

        $sheet->setCellValue("J{$dataRow}", (float) ($item->volume ?? 1));
        $sheet->setCellValue("K{$dataRow}", $item->satuan ?: '');
        $sheet->setCellValue("L{$dataRow}", (float) ($item->harga_satuan ?? 0));
        $sheet->setCellValue("M{$dataRow}", (float) ($item->total ?? 0));

        $sheet->getRowDimension($dataRow)->setRowHeight(22);
        for ($col = 'A'; $col <= 'M'; $col++) {
            $this->thinBorder($sheet, "{$col}{$dataRow}");
        }

        // Jumlah row with SUM formula
        $jumlahRow = $dataRow + 1;
        $this->writeJumlahRow($sheet, $jumlahRow, $dataRow, $dataRow);

        return $jumlahRow + 1;
    }

    private function writeSimpleNonNominatifSection(Worksheet $sheet, int $startRow, string $label, string $name, $item): int
    {
        // Compact table for belanja bahan/items without nominatif details.
        $sheet->mergeCells("B{$startRow}:F{$startRow}");
        $sheet->setCellValue("A{$startRow}", $label);
        $sheet->setCellValue("B{$startRow}", $name);
        $sheet->getStyle("A{$startRow}")->getFont()->setBold(true);
        $sheet->getStyle("B{$startRow}")->getFont()->setBold(true);
        $sheet->getRowDimension($startRow)->setRowHeight(22);

        $headerRow = $startRow + 1;
        $headerData = [
            'A' => 'No',
            'B' => 'Jenis Belanja',
            'C' => 'Vol',
            'D' => 'Satuan',
            'E' => 'Biaya Satuan',
            'F' => 'Total',
        ];

        foreach ($headerData as $col => $h) {
            $cell = $sheet->getCell("{$col}{$headerRow}");
            $cell->setValue($h);
            $cell->getStyle()->getFont()->setBold(true)->setSize(10);
            $cell->getStyle()->getAlignment()->setHorizontal('center')->setVertical('center');

            // Add gray background to header cells
            $cell->getStyle()->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D9D9D9');

            $this->thinBorder($sheet, "{$col}{$headerRow}");
        }
        $sheet->getRowDimension($headerRow)->setRowHeight(24);

        $dataRow = $headerRow + 1;
        $sheet->setCellValue("A{$dataRow}", 1);
        $sheet->setCellValue("B{$dataRow}", $item->uraian ?: 'Item');
        $sheet->setCellValue("C{$dataRow}", (float) ($item->volume ?? 1));
        $sheet->setCellValue("D{$dataRow}", $item->satuan ?: '');
        $sheet->setCellValue("E{$dataRow}", (float) ($item->harga_satuan ?? 0));
        $sheet->setCellValue("F{$dataRow}", (float) ($item->total ?? 0));

        $sheet->getRowDimension($dataRow)->setRowHeight(22);
        for ($col = 'A'; $col <= 'F'; $col++) {
            $this->thinBorder($sheet, "{$col}{$dataRow}");
        }

        $jumlahRow = $dataRow + 1;
        $this->writeCompactJumlahRow($sheet, $jumlahRow, $dataRow, $dataRow);

        return $jumlahRow + 1;
    }

    private function writeCompactJumlahRow(Worksheet $sheet, int $row, int $firstDataRow, int $lastDataRow): void
    {
        $sheet->mergeCells("A{$row}:E{$row}");
        $sheet->setCellValue("A{$row}", 'Jumlah');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal('center');

        for ($col = 'A'; $col <= 'F'; $col++) {
            $this->thinBorder($sheet, "{$col}{$row}");
        }

        $sheet->setCellValue("F{$row}", "=SUM(F{$firstDataRow}:F{$lastDataRow})");
        $sheet->getStyle("F{$row}")->getFont()->setBold(true);
        $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getRowDimension($row)->setRowHeight(22);
    }

    private function writeJumlahRow(Worksheet $sheet, int $row, int $firstDataRow, int $lastDataRow): void
    {
        // Merge A-I for "Jumlah" text (based on IPTI template)
        $sheet->mergeCells("A{$row}:I{$row}");
        $sheet->setCellValue("A{$row}", 'Jumlah');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal('left');

        // Apply borders to all cells in the row
        for ($col = 'A'; $col <= 'M'; $col++) {
            $this->thinBorder($sheet, "{$col}{$row}");
        }

        // Total in column M with SUM formula (like IPTI template: =SUM(M7:M7))
        $sheet->setCellValue("M{$row}", "=SUM(M{$firstDataRow}:M{$lastDataRow})");
        $sheet->getStyle("M{$row}")->getFont()->setBold(true);
        $sheet->getStyle("M{$row}")->getNumberFormat()->setFormatCode('#,##0');

        $sheet->getRowDimension($row)->setRowHeight(22);
    }

    // ============================================================================
    // HELPERS
    // ============================================================================

    private function setTextCell(Worksheet $sheet, string $cell, $value): void
    {
        $val = $value ?? '';
        if ($val !== '' && $val !== null && $val !== '-') {
            $sheet->setCellValueExplicit($cell, (string) $val, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
        } else {
            $sheet->setCellValue($cell, $val ?: '-');
        }
    }

    private function thinBorder(Worksheet $sheet, string $cell): void
    {
        $sheet->getStyle($cell)->getBorders()->getAllBorders()->setBorderStyle(
            \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN
        );
    }

    private function formatRupiah(float $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }

    private function fmtTgl($date): string
    {
        $bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $d = is_string($date) ? new \DateTime($date) : $date;

        return $d->format('d').' '.$bulan[(int) $d->format('n')].' '.$d->format('Y');
    }
}
