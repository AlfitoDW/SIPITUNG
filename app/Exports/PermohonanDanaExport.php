<?php

namespace App\Exports;

use App\Models\PermohonanDana;
use App\Models\User;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PermohonanDanaExport
{
    private PermohonanDana $pd;

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

        // Sheet 1: PERMOHONAN DANA
        $sheet1 = $spreadsheet->getSheetByName('PERMOHONAN DANA');
        if ($sheet1) {
            $this->populateSheet1($sheet1);
        }

        // Sheet 2: RINCIAN ANGGARAN BIAYA
        $sheet2 = $spreadsheet->getSheetByName('RINCIAN ANGGARAN BIAYA');
        if ($sheet2) {
            $this->populateSheet2($sheet2);
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
        $replacements = $this->buildSheet1Replacements();

        $totalRows = $sheet->getHighestDataRow();

        for ($row = 1; $row <= $totalRows; $row++) {
            for ($colIdx = 1; $colIdx <= 10; $colIdx++) {
                $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx);
                $value = $sheet->getCell("{$col}{$row}")->getValue();

                // Convert RichText objects to plain text
                if ($value instanceof RichText) {
                    $value = $value->getPlainText();
                }

                if (is_string($value) && str_contains($value, '{{')) {
                    $newValue = preg_replace_callback(
                        '/\{\{([^}]+)\}\}/',
                        function (array $m) use ($replacements): string {
                            return (string) ($replacements[$m[1]] ?? $m[0]);
                        },
                        $value
                    );
                    $sheet->setCellValue("{$col}{$row}", $newValue);
                }
            }
        }
    }

    private function buildSheet1Replacements(): array
    {
        $dja = $this->pd->djaDisplayPayload();

        $program = $dja['dja_program']['nama'] ?? '';
        $sasaran = $dja['dja_sasaran']['nama'] ?? '';
        $kroNama = $dja['dja_kro']['nama'] ?? '';
        $roNama = $dja['dja_ro']['nama'] ?? '';
        $komponen = $dja['dja_komponen']['nama'] ?? '';
        $kegiatan = ($dja['dja_kegiatan']['kode'] ?? '').' '.($dja['dja_kegiatan']['nama'] ?? '');

        // Waktu pelaksanaan
        $waktu = $this->getWaktuPelaksanaan();

        // Tempat
        $tempat = $this->pd->tempat ?: 'JAKARTA';
        if ($this->pd->judul_pekerjaan) {
            $tempat = $this->pd->judul_pekerjaan.' - '.$tempat;
        }

        $replacements = [
            'program' => $program,
            'sasaran' => $sasaran,
            'kro' => $kroNama,
            'ro' => $roNama,
            'komponen' => $komponen,
            'kegiatan' => trim($kegiatan),
            'waktu' => $waktu,
            'tempat' => $tempat,
        ];

        // Kebutuhan Biaya items (11.1 - 11.9)
        $items = $this->pd->items;
        $idx = 0;
        $grandTotal = 0;

        foreach ($items as $item) {
            $idx++;
            $totalItem = (float) ($item->total ?? 0);
            $grandTotal += $totalItem;

            $replacements["item_no_{$idx}"] = "11.{$idx}";
            $replacements["item_name_{$idx}"] = $item->uraian ?: 'Item '.$idx;
            $replacements["item_total_{$idx}"] = $this->formatRupiah($totalItem);
        }

        // Clear unused item placeholders
        for ($i = $idx + 1; $i <= 9; $i++) {
            $replacements["item_no_{$i}"] = '';
            $replacements["item_name_{$i}"] = '';
            $replacements["item_total_{$i}"] = '';
        }

        $replacements['grand_total'] = $this->formatRupiah($grandTotal);

        // Document checklist
        $uploadedJenisIds = $this->pd->dokumens->pluck('jenis_dokumen_id')->unique()->toArray();
        for ($j = 1; $j <= 8; $j++) {
            $replacements["dok_{$j}_cek"] = in_array($j, $uploadedJenisIds) ? '☑' : '☐';
        }

        // Signatures
        $tglSurat = now()->locale('id')->isoFormat('D MMMM YYYY');
        if ($this->pd->created_at) {
            $tglSurat = $this->pd->created_at->locale('id')->isoFormat('D MMMM YYYY');
        }
        $replacements['tanggal_surat'] = $tglSurat;

        // PPK: use snapshot first, fallback to active PPK
        $ppkName = $this->pd->ppk_approved_by_name;
        $ppkNip = $this->pd->ppk_approved_by_nip;

        if (! $ppkName) {
            $activePpk = User::where('role', 'pimpinan')
                ->where('pimpinan_type', 'ppk')
                ->where('is_active', true)
                ->first();
            $ppkName = $activePpk?->nama_lengkap;
            $ppkNip = $ppkNip ?: $activePpk?->nip;
        }

        // Pemohon: use snapshot (creator)
        $pemohonName = $this->pd->created_by_name;
        $pemohonNip = $this->pd->created_by_nip;

        $replacements['ppk_name'] = $ppkName ?: '___________________________';
        $replacements['ppk_nip'] = $ppkNip ?: '-';
        $replacements['pemohon_name'] = $pemohonName ?: '___________________________';
        $replacements['pemohon_nip'] = $pemohonNip ?: '-';

        return $replacements;
    }

    private function getWaktuPelaksanaan(): string
    {
        if (! $this->pd->tanggal_mulai || ! $this->pd->tanggal_selesai) {
            return '';
        }
        $m = $this->fmtTgl($this->pd->tanggal_mulai);
        $s = $this->fmtTgl($this->pd->tanggal_selesai);

        return $m === $s ? $m : "{$m} s.d. {$s}";
    }

    // ============================================================================
    // SHEET 2: RINCIAN ANGGARAN BIAYA
    // ============================================================================

    private function populateSheet2(Worksheet $sheet): void
    {
        // Fill the title
        $judul = $this->pd->judul_pekerjaan ?: $this->pd->keperluan ?: '';
        $sheet->setCellValue('A2', $judul);

        // Clear template sections (from row 4 onwards)
        $this->clearSheetTwoContent($sheet);

        // Build sections from items
        $items = $this->pd->items;
        $currentRow = 4;
        $sectionLetters = range('A', 'Z');

        foreach ($items as $idx => $item) {
            $sectionLabel = $sectionLetters[$idx].'.';
            $sectionName = $item->uraian ?: 'Item '.($idx + 1);
            $hasNominatif = $item->nominatif->isNotEmpty();

            if ($hasNominatif) {
                $currentRow = $this->writeNominatifSection($sheet, $currentRow, $sectionLabel, $sectionName, $item);
            } else {
                $currentRow = $this->writeNonNominatifSection($sheet, $currentRow, $sectionLabel, $sectionName, $item);
            }

            $currentRow += 2; // gap between sections
        }

        // Set print area
        $lastCol = 'M';
        $lastRow = $currentRow - 1;
        $sheet->getPageSetup()->setPrintArea("A1:{$lastCol}{$lastRow}");
    }

    private function clearSheetTwoContent(Worksheet $sheet): void
    {
        // Collect merge ranges first to avoid modification during iteration
        $mergeCells = $sheet->getMergeCells();
        foreach ($mergeCells as $range => $_) {
            [$start, $end] = explode(':', $range);
            $startRow = (int) filter_var($start, FILTER_SANITIZE_NUMBER_INT);
            if ($startRow >= 4) {
                $sheet->unmergeCells($range);
            }
        }

        // Clear everything from row 4 onwards
        $lastRow = $sheet->getHighestDataRow();
        for ($row = 4; $row <= $lastRow; $row++) {
            for ($col = 'A'; $col <= 'M'; $col++) {
                $sheet->setCellValue("{$col}{$row}", '');
                $sheet->getStyle("{$col}{$row}")->applyFromArray([
                    'borders' => [
                        'allBorders' => ['style' => 'none'],
                    ],
                ]);
            }
        }
    }

    private function writeNominatifSection(Worksheet $sheet, int $startRow, string $label, string $name, $item): int
    {
        // Section header
        $sheet->mergeCells("B{$startRow}:K{$startRow}");
        $sheet->setCellValue("A{$startRow}", $label);
        $sheet->setCellValue("B{$startRow}", $name);
        $sheet->getStyle("A{$startRow}")->getFont()->setBold(true);
        $sheet->getStyle("B{$startRow}")->getFont()->setBold(true);
        $sheet->getRowDimension($startRow)->setRowHeight(22);

        // Table headers
        $headerRow = $startRow + 1;
        $headers = ['No', 'Nama Pegawai', 'Jabatan', 'NIK', 'NPWP',
            'No. Rekening', 'Nama Rekening', 'Nama Bank', 'Email',
            'Vol', 'Satuan', 'Biaya Satuan', 'Total'];

        foreach ($headers as $colIdx => $h) {
            $col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $cell = $sheet->getCell("{$col}{$headerRow}");
            $cell->setValue($h);
            $cell->getStyle()->getFont()->setBold(true)->setSize(10);
            $cell->getStyle()->getAlignment()->setHorizontal('center')->setVertical('center')->setWrapText(true);
            $this->thinBorder($sheet, "{$col}{$headerRow}");
        }
        $sheet->getRowDimension($headerRow)->setRowHeight(30);

        // Data rows
        $dataRow = $headerRow + 1;
        $totalSection = 0;
        $no = 1;

        foreach ($item->nominatif as $nom) {
            $this->writeNominatifRow($sheet, $dataRow, $no, $nom);
            $totalSection += (float) $nom->jumlah_bruto;
            $dataRow++;
            $no++;
        }

        // Jumlah row
        $this->writeJumlahRow($sheet, $dataRow, $totalSection);
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
        // Section header
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
            $this->thinBorder($sheet, "{$col}{$headerRow}");
        }

        // Merge middle columns C-I for the header
        $sheet->mergeCells("C{$headerRow}:I{$headerRow}");
        for ($c = 'C'; $c <= 'I'; $c++) {
            $this->thinBorder($sheet, "{$c}{$headerRow}");
        }
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

        // Jumlah row
        $jumlahRow = $dataRow + 1;
        $this->writeJumlahRow($sheet, $jumlahRow, (float) ($item->total ?? 0));

        return $jumlahRow + 1;
    }

    private function writeJumlahRow(Worksheet $sheet, int $row, float $total): void
    {
        $sheet->mergeCells("A{$row}:K{$row}");
        $sheet->setCellValue("A{$row}", 'Jumlah');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal('right');

        for ($col = 'A'; $col <= 'L'; $col++) {
            $this->thinBorder($sheet, "{$col}{$row}");
        }

        $sheet->setCellValue("L{$row}", $this->formatRupiah($total));
        $sheet->getStyle("L{$row}")->getFont()->setBold(true);
        $sheet->getStyle("M{$row}")->getFont()->setBold(true);
        $this->thinBorder($sheet, "M{$row}");

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
