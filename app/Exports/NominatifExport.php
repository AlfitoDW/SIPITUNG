<?php

namespace App\Exports;

use App\Models\PermohonanDana;
use App\Models\User;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Export Daftar Nominatif ke Excel (.xlsx)
 *
 * Menangani 4 format sheet berdasarkan kode akun:
 * - 521115: Honor Format A (tanpa Jabatan)
 * - 521213/522151: Honor Format B (dengan Jabatan)
 * - 524111/524119: Perjadin Luar Kota
 * - 524113/524114: Perjadin Dalam Kota
 */
class NominatifExport
{
    private PermohonanDana $pd;
    private ?User $ppk;
    private ?User $bendahara;
    private string $tglNominatif;

    // Format constants
    private const HONOR_AKUN = ['521115', '521213', '522151'];
    private const PERJADIN_LUAR_AKUN = ['524111', '524119'];
    private const PERJADIN_DALAM_AKUN = ['524113', '524114'];

    public function __construct(PermohonanDana $pd)
    {
        $this->pd = $pd;
        $this->pd->load([
            'items.nominatif',
            'items.djaRincianBiaya',
            'timKerja',
            'djaKegiatan',
            'ppkApprovedBy',
        ]);

        $this->ppk = $this->pd->ppkApprovedBy;
        $this->bendahara = User::where('role', 'bendahara')->where('is_active', true)->first();
        $this->tglNominatif = $this->pd->tgl_nominatif
            ? $this->pd->tgl_nominatif->locale('id')->isoFormat('D MMMM YYYY')
            : now()->locale('id')->isoFormat('D MMMM YYYY');
    }

    // ─── Entry point ──────────────────────────────────────────────────────────

    public function download(): StreamedResponse
    {
        $allNominatifAkun = array_merge(self::HONOR_AKUN, self::PERJADIN_LUAR_AKUN, self::PERJADIN_DALAM_AKUN);

        $grouped = $this->pd->items
            ->filter(fn ($item) => in_array($item->kode_akun, $allNominatifAkun))
            ->groupBy('kode_akun');

        $spreadsheet = new Spreadsheet;
        $spreadsheet->getDefaultStyle()->getFont()->setName('Times New Roman')->setSize(11);
        $spreadsheet->removeSheetByIndex(0);

        $sheetIdx = 0;
        foreach ($grouped as $kodeAkun => $items) {
            $kodeAkun = (string) $kodeAkun;
            $isHonor = in_array($kodeAkun, self::HONOR_AKUN);

            $sheet = $spreadsheet->createSheet($sheetIdx++);
            $sheet->setTitle(substr($kodeAkun, 0, 31));
            $sheet->getTabColor()->setRGB($isHonor ? 'F4B084' : '00B0F0');

            $this->renderSheet($sheet, $kodeAkun, $items);
            $this->setupPage($sheet);
        }

        if ($sheetIdx === 0) {
            $sheet = $spreadsheet->createSheet(0);
            $sheet->setTitle('Nominatif');
            $sheet->setCellValue('A1', 'Belum ada data nominatif untuk permohonan ini.');
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

    // ─── Sheet dispatch ───────────────────────────────────────────────────────

    private function renderSheet($sheet, string $kodeAkun, $items): void
    {
        $firstItem = $items->first();
        $namaItem = $firstItem->djaRincianBiaya?->nama_item ?? $firstItem->uraian ?? '-';

        $noSk = $this->pd->no_sk ?? '-';
        $tglSk = $this->pd->tgl_sk ? $this->formatTanggalIndo($this->pd->tgl_sk) : '-';
        $noSt = $this->pd->no_st ?? '-';
        $tglSt = $this->pd->tgl_st ? $this->formatTanggalIndo($this->pd->tgl_st) : '-';

        $judul = match ($kodeAkun) {
            '521213' => 'HONORARIUM PANITIA',
            '522151' => 'HONORARIUM NARASUMBER DAN MODERATOR',
            '521115' => 'HONORARIUM OPERASIONAL SATUAN KERJA',
            default => 'TRANSPORT DAN UANG HARIAN PERJALANAN DINAS',
        };

        $isHonor = in_array($kodeAkun, self::HONOR_AKUN);
        $suratLabel = $isHonor
            ? 'Surat Keputusan Kepala LLDIKTI Wilayah III selaku KPA'
            : 'Surat Tugas Kepala LLDIKTI Wilayah III selaku KPA';
        $nomorSurat = $isHonor
            ? "Nomor : {$noSk} Tanggal {$tglSk}"
            : "Nomor : {$noSt} Tanggal {$tglSt}";

        $sheet->setCellValue('A1', 'Lampiran :');
        $sheet->setCellValue('A2', $suratLabel);
        $sheet->setCellValue('A3', $nomorSurat);
        $sheet->getStyle('A1:A3')->getFont()->setItalic(true);

        $allNominatif = collect();
        foreach ($items as $item) {
            foreach ($item->nominatif as $nom) {
                $allNominatif->push($nom);
            }
        }

        match (true) {
            $kodeAkun === '521115' => $this->renderHonorFormatA($sheet, $allNominatif, $judul, $kodeAkun, $namaItem),
            in_array($kodeAkun, ['521213', '522151']) => $this->renderHonorFormatB($sheet, $allNominatif, $judul, $kodeAkun, $namaItem),
            in_array($kodeAkun, self::PERJADIN_LUAR_AKUN) => $this->renderPerjadinLuarKota($sheet, $allNominatif, $judul, $kodeAkun, $namaItem),
            in_array($kodeAkun, self::PERJADIN_DALAM_AKUN) => $this->renderPerjadinDalamKota($sheet, $allNominatif, $judul, $kodeAkun, $namaItem),
        };
    }

    // ─── Format A — Honor 521115 (tanpa Jabatan) ─────────────────────────────

    private function renderHonorFormatA($sheet, $nominatifRows, $judul, $kodeAkun, $namaItem): void
    {
        $lastCol = 'P';

        $sheet->mergeCells("A5:{$lastCol}5");
        $sheet->setCellValue('A5', "DAFTAR PEMBAYARAN {$judul}");
        $sheet->getStyle('A5')->getFont()->setBold(true);
        $sheet->getStyle("A5:{$lastCol}5")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $bulan = $this->pd->tanggal_mulai ? $this->formatTanggalIndo($this->pd->tanggal_mulai) : '';
        $sheet->mergeCells("A6:{$lastCol}6");
        $sheet->setCellValue('A6', 'BULAN '.strtoupper($bulan));
        $sheet->getStyle("A6:{$lastCol}6")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue('A7', "{$kodeAkun} {$namaItem}");

        $sheet->mergeCells("A8:{$lastCol}8");
        $sheet->setCellValue('A8', '');

        $this->setColumnWidthsHonorA($sheet);

        // Header baris 9-10
        $sheet->mergeCells('A9:A10'); $sheet->setCellValue('A9', 'No');
        $sheet->mergeCells('B9:B10'); $sheet->setCellValue('B9', 'Nama');
        $sheet->mergeCells('C9:C10'); $sheet->setCellValue('C9', 'NIK');
        $sheet->mergeCells('D9:D10'); $sheet->setCellValue('D9', 'NPWP');
        $sheet->mergeCells('E9:E10'); $sheet->setCellValue('E9', 'Gol');
        $sheet->mergeCells('F9:H9'); $sheet->setCellValue('F9', 'Honorarium');
        $sheet->setCellValue('F10', 'Jml Keg');
        $sheet->setCellValue('G10', 'Rp./Jam');
        $sheet->setCellValue('H10', 'Jml Bruto');
        $sheet->mergeCells('I9:I10'); $sheet->setCellValue('I9', "Dasar Pengenaan Pajak (DPP)\nPNS / Non PNS");
        $sheet->getStyle('I9')->getAlignment()->setWrapText(true);
        $sheet->mergeCells('J9:K9'); $sheet->setCellValue('J9', 'PPH 21');
        $sheet->setCellValue('J10', 'Tarif **');
        $sheet->setCellValue('K10', 'Jml Pajak');
        $sheet->mergeCells('L9:L10'); $sheet->setCellValue('L9', 'Jumlah Diterima');
        $sheet->mergeCells('M9:M10'); $sheet->setCellValue('M9', 'Atas Nama Rekening');
        $sheet->mergeCells('N9:N10'); $sheet->setCellValue('N9', 'Nomor Rekening');
        $sheet->mergeCells('O9:O10'); $sheet->setCellValue('O9', 'Bank');
        $sheet->mergeCells('P9:P10'); $sheet->setCellValue('P9', 'Email');

        $this->styleHeaderRange($sheet, 'A9:P10');
        $sheet->getRowDimension(9)->setRowHeight(35);
        $sheet->getRowDimension(10)->setRowHeight(20);

        // Formula row 11
        $sheet->setCellValue('A11', 'A');
        $sheet->setCellValue('B11', 'B');
        $sheet->setCellValue('C11', 'C');
        $sheet->setCellValue('D11', 'D');
        $sheet->setCellValue('E11', 'E');
        $sheet->setCellValue('F11', 'F');
        $sheet->setCellValue('G11', 'G');
        $sheet->setCellValue('H11', 'H = F x G');
        $sheet->setCellValue('I11', 'I=H');
        $sheet->setCellValue('J11', 'J');
        $sheet->setCellValue('K11', 'K= ( J x I )');
        $sheet->setCellValue('L11', 'L = ( H-K )');
        $sheet->setCellValue('M11', 'M');
        $sheet->setCellValue('N11', 'N');
        $sheet->setCellValue('O11', 'O');
        $sheet->setCellValue('P11', 'P');
        $sheet->getStyle('A11:P11')->getFont()->setItalic(true)->setSize(9);
        $sheet->getStyle('A11:P11')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $this->borderRow($sheet, 'A11:P11');

        // Thick border between formula and data
        $sheet->getStyle('A12:P12')->getBorders()->getTop()->setBorderStyle(Border::BORDER_THICK);

        // Data rows start at 12
        $row = 12;
        $no = 1;
        $totalVol = $totalHarga = $totalBruto = $totalDpp = $totalPajak = $totalDiterima = 0;

        foreach ($nominatifRows as $nom) {
            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", $nom->nama);
            $sheet->setCellValue("C{$row}", $nom->nik);
            $sheet->setCellValue("D{$row}", $nom->npwp);
            $sheet->setCellValue("E{$row}", $nom->gol_ruang);
            $sheet->setCellValue("F{$row}", (float) $nom->volume);
            $sheet->setCellValue("G{$row}", (float) $nom->harga_satuan);
            $sheet->setCellValue("H{$row}", (float) $nom->jumlah_bruto);
            $sheet->setCellValue("I{$row}", $nom->gol_ruang === 'Non PNS' ? 'Non PNS' : 'PNS');
            $sheet->setCellValue("J{$row}", (float) $nom->pph21_persen / 100);
            $sheet->setCellValue("K{$row}", (float) $nom->jumlah_pajak);
            $sheet->setCellValue("L{$row}", (float) $nom->jumlah_diterima);
            $sheet->setCellValue("M{$row}", $nom->nama_rekening);
            $sheet->setCellValue("N{$row}", $nom->no_rekening);
            $sheet->setCellValue("O{$row}", $nom->nama_bank);
            $sheet->setCellValue("P{$row}", $nom->email);

            $sheet->getStyle("C{$row}:D{$row}")->getNumberFormat()->setFormatCode('@');
            $sheet->getStyle("N{$row}")->getNumberFormat()->setFormatCode('@');
            $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("G{$row}:H{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("K{$row}:L{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("J{$row}")->getNumberFormat()->setFormatCode('0.00%');
            $this->borderRow($sheet, "A{$row}:P{$row}");

            $totalVol += (float) $nom->volume;
            $totalHarga += (float) $nom->harga_satuan;
            $totalBruto += (float) $nom->jumlah_bruto;
            $totalDpp += (float) $nom->jumlah_bruto;
            $totalPajak += (float) $nom->jumlah_pajak;
            $totalDiterima += (float) $nom->jumlah_diterima;
            $row++;
        }

        // Baris jumlah
        $sheet->setCellValue("B{$row}", 'Jumlah');
        $sheet->setCellValue("F{$row}", $totalVol);
        $sheet->setCellValue("G{$row}", $totalHarga);
        $sheet->setCellValue("H{$row}", $totalBruto);
        $sheet->setCellValue("I{$row}", $totalDpp);
        $sheet->setCellValue("J{$row}", '-');
        $sheet->setCellValue("K{$row}", $totalPajak);
        $sheet->setCellValue("L{$row}", $totalDiterima);
        $sheet->getStyle("B{$row}:L{$row}")->getFont()->setBold(true);
        $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("G{$row}:H{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("K{$row}:L{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $this->styleTotalRow($sheet, "A{$row}:P{$row}");

        $this->renderHonorFooter($sheet, $row, $totalDiterima);
    }

    // ─── Format B — Honor 521213/522151 (dengan Jabatan) ─────────────────────

    private function renderHonorFormatB($sheet, $nominatifRows, $judul, $kodeAkun, $namaItem): void
    {
        $lastCol = 'Q';

        $sheet->mergeCells("A5:{$lastCol}5");
        $sheet->setCellValue('A5', "DAFTAR PEMBAYARAN {$judul}");
        $sheet->getStyle('A5')->getFont()->setBold(true);
        $sheet->getStyle("A5:{$lastCol}5")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A6:{$lastCol}6");
        $sheet->setCellValue('A6', 'KEGIATAN '.strtoupper($this->pd->keperluan));
        $sheet->getStyle("A6:{$lastCol}6")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $tahun = $this->pd->tanggal_mulai ? substr($this->pd->tanggal_mulai, 0, 4) : now()->year;
        $sheet->mergeCells("A7:{$lastCol}7");
        $sheet->setCellValue('A7', "DI LINGKUNGAN LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III JAKARTA TAHUN ANGGARAN {$tahun}");
        $sheet->getStyle("A7:{$lastCol}7")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $tglPelaksanaan = '';
        if ($this->pd->tanggal_mulai && $this->pd->tanggal_selesai) {
            $tglMulai = $this->formatTanggalIndo($this->pd->tanggal_mulai);
            $tglSelesai = $this->formatTanggalIndo($this->pd->tanggal_selesai);
            $tglPelaksanaan = $tglMulai === $tglSelesai ? strtoupper($tglMulai) : strtoupper("{$tglMulai} S.D. {$tglSelesai}");
        }
        $sheet->mergeCells("A8:{$lastCol}8");
        $sheet->setCellValue('A8', 'DI '.strtoupper($this->pd->tempat ?? 'JAKARTA')." TANGGAL {$tglPelaksanaan}");
        $sheet->getStyle("A8:{$lastCol}8")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A9:{$lastCol}9");
        $sheet->setCellValue('A9', "{$kodeAkun} {$namaItem}");
        $sheet->getStyle("A9:{$lastCol}9")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A10:{$lastCol}10");
        $sheet->setCellValue('A10', '');

        $this->setColumnWidthsHonorB($sheet);

        // Header baris 11-13
        $sheet->mergeCells('A11:A13'); $sheet->setCellValue('A11', 'No');
        $sheet->mergeCells('B11:B13'); $sheet->setCellValue('B11', 'Nama');
        $sheet->mergeCells('C11:C13'); $sheet->setCellValue('C11', 'Jabatan Dalam Tugas');
        $sheet->mergeCells('D11:D13'); $sheet->setCellValue('D11', 'NIK');
        $sheet->mergeCells('E11:E13'); $sheet->setCellValue('E11', 'NPWP');
        $sheet->mergeCells('F11:F13'); $sheet->setCellValue('F11', 'Gol');
        $sheet->mergeCells('G11:I11'); $sheet->setCellValue('G11', 'Honorarium');
        $sheet->mergeCells('G12:G13'); $sheet->setCellValue('G12', 'Jml Keg');
        $sheet->mergeCells('H12:H13'); $sheet->setCellValue('H12', 'Rp./Jam');
        $sheet->mergeCells('I12:I13'); $sheet->setCellValue('I12', 'Jml Bruto');
        $sheet->mergeCells('J11:J13'); $sheet->setCellValue('J11', "Dasar Pengenaan Pajak (DPP)\nPNS / Non PNS");
        $sheet->getStyle('J11')->getAlignment()->setWrapText(true);
        $sheet->mergeCells('K11:L11'); $sheet->setCellValue('K11', 'PPH 21');
        $sheet->mergeCells('K12:K13'); $sheet->setCellValue('K12', 'Tarif **');
        $sheet->mergeCells('L12:L13'); $sheet->setCellValue('L12', 'Jml Pajak');
        $sheet->mergeCells('M11:M13'); $sheet->setCellValue('M11', 'Jumlah Diterima');
        $sheet->mergeCells('N11:N13'); $sheet->setCellValue('N11', 'Atas Nama Rekening');
        $sheet->mergeCells('O11:O13'); $sheet->setCellValue('O11', 'Nomor Rekening');
        $sheet->mergeCells('P11:P13'); $sheet->setCellValue('P11', 'Bank');
        $sheet->mergeCells('Q11:Q13'); $sheet->setCellValue('Q11', 'Email');

        $this->styleHeaderRange($sheet, 'A11:Q13');
        $sheet->getRowDimension(11)->setRowHeight(35);
        $sheet->getRowDimension(12)->setRowHeight(20);
        $sheet->getRowDimension(13)->setRowHeight(20);

        // Formula row 13
        $sheet->setCellValue('A13', 'A');
        $sheet->setCellValue('B13', 'B');
        $sheet->setCellValue('C13', '');
        $sheet->setCellValue('D13', 'C');
        $sheet->setCellValue('E13', 'D');
        $sheet->setCellValue('F13', 'E');
        $sheet->setCellValue('G13', 'F');
        $sheet->setCellValue('H13', 'G');
        $sheet->setCellValue('I13', 'H = F x G');
        $sheet->setCellValue('J13', 'I=H');
        $sheet->setCellValue('K13', 'J');
        $sheet->setCellValue('L13', 'K= ( J x I )');
        $sheet->setCellValue('M13', 'L = ( H-K )');
        $sheet->setCellValue('N13', 'M');
        $sheet->setCellValue('O13', 'N');
        $sheet->setCellValue('P13', 'O');
        $sheet->setCellValue('Q13', 'P');
        $sheet->getStyle('A13:Q13')->getFont()->setItalic(true)->setSize(9);
        $sheet->getStyle('A13:Q13')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $this->borderRow($sheet, 'A13:Q13');

        // Thick border between formula and data
        $sheet->getStyle('A14:Q14')->getBorders()->getTop()->setBorderStyle(Border::BORDER_THICK);

        // Data rows start at 14
        $row = 14;
        $no = 1;
        $totalVol = $totalHarga = $totalBruto = $totalDpp = $totalPajak = $totalDiterima = 0;

        foreach ($nominatifRows as $nom) {
            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", $nom->nama);
            $sheet->setCellValue("C{$row}", $nom->jabatan);
            $sheet->setCellValue("D{$row}", $nom->nik);
            $sheet->setCellValue("E{$row}", $nom->npwp);
            $sheet->setCellValue("F{$row}", $nom->gol_ruang);
            $sheet->setCellValue("G{$row}", (float) $nom->volume);
            $sheet->setCellValue("H{$row}", (float) $nom->harga_satuan);
            $sheet->setCellValue("I{$row}", (float) $nom->jumlah_bruto);
            $sheet->setCellValue("J{$row}", $nom->gol_ruang === 'Non PNS' ? 'Non PNS' : 'PNS');
            $sheet->setCellValue("K{$row}", (float) $nom->pph21_persen / 100);
            $sheet->setCellValue("L{$row}", (float) $nom->jumlah_pajak);
            $sheet->setCellValue("M{$row}", (float) $nom->jumlah_diterima);
            $sheet->setCellValue("N{$row}", $nom->nama_rekening);
            $sheet->setCellValue("O{$row}", $nom->no_rekening);
            $sheet->setCellValue("P{$row}", $nom->nama_bank);
            $sheet->setCellValue("Q{$row}", $nom->email);

            $sheet->getStyle("D{$row}:E{$row}")->getNumberFormat()->setFormatCode('@');
            $sheet->getStyle("O{$row}")->getNumberFormat()->setFormatCode('@');
            $sheet->getStyle("G{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("H{$row}:I{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("L{$row}:M{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("K{$row}")->getNumberFormat()->setFormatCode('0.00%');
            $this->borderRow($sheet, "A{$row}:Q{$row}");

            $totalVol += (float) $nom->volume;
            $totalHarga += (float) $nom->harga_satuan;
            $totalBruto += (float) $nom->jumlah_bruto;
            $totalDpp += (float) $nom->jumlah_bruto;
            $totalPajak += (float) $nom->jumlah_pajak;
            $totalDiterima += (float) $nom->jumlah_diterima;
            $row++;
        }

        // Baris jumlah
        $sheet->setCellValue("B{$row}", 'Jumlah');
        $sheet->setCellValue("G{$row}", $totalVol);
        $sheet->setCellValue("H{$row}", $totalHarga);
        $sheet->setCellValue("I{$row}", $totalBruto);
        $sheet->setCellValue("J{$row}", $totalDpp);
        $sheet->setCellValue("K{$row}", '-');
        $sheet->setCellValue("L{$row}", $totalPajak);
        $sheet->setCellValue("M{$row}", $totalDiterima);
        $sheet->getStyle("B{$row}:M{$row}")->getFont()->setBold(true);
        $sheet->getStyle("G{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("H{$row}:I{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("J{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("L{$row}:M{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $this->styleTotalRow($sheet, "A{$row}:Q{$row}");

        $this->renderHonorFooter($sheet, $row, $totalDiterima);
    }

    // ─── Format C1 — Perjadin Luar Kota (524111 / 524119) ────────────────────

    private function renderPerjadinLuarKota($sheet, $nominatifRows, $judul, $kodeAkun, $namaItem): void
    {
        $lastCol = 'U';

        $sheet->mergeCells("A5:{$lastCol}5");
        $sheet->setCellValue('A5', 'DAFTAR PEMBAYARAN TRANSPORT DAN UANG HARIAN PERJALANAN DINAS');
        $sheet->getStyle('A5')->getFont()->setBold(true);
        $sheet->getStyle("A5:{$lastCol}5")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A6:{$lastCol}6");
        $sheet->setCellValue('A6', 'KEGIATAN '.strtoupper($this->pd->keperluan));
        $sheet->getStyle("A6:{$lastCol}6")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $tahun = $this->pd->tanggal_mulai ? substr($this->pd->tanggal_mulai, 0, 4) : now()->year;
        $sheet->mergeCells("A7:{$lastCol}7");
        $sheet->setCellValue('A7', "DI LINGKUNGAN LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III JAKARTA TAHUN ANGGARAN {$tahun}");
        $sheet->getStyle("A7:{$lastCol}7")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $tglPelaksanaan = '';
        if ($this->pd->tanggal_mulai && $this->pd->tanggal_selesai) {
            $tglMulai = $this->formatTanggalIndo($this->pd->tanggal_mulai);
            $tglSelesai = $this->formatTanggalIndo($this->pd->tanggal_selesai);
            $tglPelaksanaan = $tglMulai === $tglSelesai ? strtoupper($tglMulai) : strtoupper("{$tglMulai} S.D. {$tglSelesai}");
        }
        $sheet->mergeCells("A8:{$lastCol}8");
        $sheet->setCellValue('A8', 'DI '.strtoupper($this->pd->tempat ?? 'JAKARTA')." TANGGAL {$tglPelaksanaan}");
        $sheet->getStyle("A8:{$lastCol}8")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A9:{$lastCol}9");
        $sheet->setCellValue('A9', "{$kodeAkun} {$namaItem}");
        $sheet->getStyle("A9:{$lastCol}9")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A10:{$lastCol}10");
        $sheet->setCellValue('A10', '');

        $this->setColumnWidthsPerjadinLuar($sheet);

        // Header baris 11-12
        $sheet->mergeCells('B11:B12'); $sheet->setCellValue('B11', 'No');
        $sheet->mergeCells('C11:C12'); $sheet->setCellValue('C11', 'Nama');
        $sheet->mergeCells('D11:D12'); $sheet->setCellValue('D11', 'Transport (Rp.)');
        $sheet->mergeCells('E11:G11'); $sheet->setCellValue('E11', 'Uang Harian Biasa');
        $sheet->setCellValue('E12', 'Jml Hari');
        $sheet->setCellValue('F12', 'Satuan');
        $sheet->setCellValue('G12', 'Jumlah');
        $sheet->mergeCells('H11:J11'); $sheet->setCellValue('H11', 'Uang Harian Fullboard');
        $sheet->setCellValue('H12', 'Jml Hari');
        $sheet->setCellValue('I12', 'Satuan');
        $sheet->setCellValue('J12', 'Jumlah');
        $sheet->mergeCells('K11:M11'); $sheet->setCellValue('K11', 'Uang Harian Fullday');
        $sheet->setCellValue('K12', 'Jml Hari');
        $sheet->setCellValue('L12', 'Satuan');
        $sheet->setCellValue('M12', 'Jumlah');
        $sheet->mergeCells('N11:N12'); $sheet->setCellValue('N11', 'Taksi PP');
        $sheet->mergeCells('O11:O12'); $sheet->setCellValue('O11', 'Tiket Pesawat');
        $sheet->mergeCells('P11:P12'); $sheet->setCellValue('P11', 'Akomodasi Hotel');
        $sheet->mergeCells('Q11:Q12'); $sheet->setCellValue('Q11', 'Jumlah Diterima (Rp.)');
        $sheet->mergeCells('R11:R12'); $sheet->setCellValue('R11', 'Atas Nama Rekening');
        $sheet->mergeCells('S11:S12'); $sheet->setCellValue('S11', 'Nomor Rekening');
        $sheet->mergeCells('T11:T12'); $sheet->setCellValue('T11', 'Bank');
        $sheet->mergeCells('U11:U12'); $sheet->setCellValue('U11', 'Email');

        $this->styleHeaderRange($sheet, 'B11:U12');
        $sheet->getRowDimension(11)->setRowHeight(35);
        $sheet->getRowDimension(12)->setRowHeight(20);

        // Formula row 13
        $sheet->setCellValue('B13', 'A');
        $sheet->setCellValue('C13', 'B');
        $sheet->setCellValue('D13', 'C');
        $sheet->setCellValue('E13', 'D');
        $sheet->setCellValue('F13', 'E');
        $sheet->setCellValue('G13', 'F = D x E');
        $sheet->setCellValue('H13', 'G');
        $sheet->setCellValue('I13', 'H ');
        $sheet->setCellValue('J13', 'I = G x H');
        $sheet->setCellValue('K13', 'J');
        $sheet->setCellValue('L13', 'K');
        $sheet->setCellValue('M13', 'L = J x K');
        $sheet->setCellValue('N13', 'C');
        $sheet->setCellValue('O13', 'C');
        $sheet->setCellValue('P13', '');
        $sheet->setCellValue('Q13', 'M = C + F + I + L');
        $sheet->setCellValue('R13', 'N');
        $sheet->setCellValue('S13', 'O');
        $sheet->setCellValue('T13', 'P');
        $sheet->setCellValue('U13', 'Q');
        $sheet->getStyle('B13:U13')->getFont()->setItalic(true)->setSize(9);
        $sheet->getStyle('B13:U13')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $this->borderRow($sheet, 'B13:U13');

        // Thick border between formula and data
        $sheet->getStyle('B14:U14')->getBorders()->getTop()->setBorderStyle(Border::BORDER_THICK);

        // Data rows start at 14
        $row = 14;
        $no = 1;
        $totals = [
            'transport' => 0, 'biasa' => 0, 'fb' => 0, 'fd' => 0,
            'taksi' => 0, 'tiket' => 0, 'hotel' => 0, 'diterima' => 0,
        ];

        foreach ($nominatifRows as $nom) {
            $sheet->setCellValue("B{$row}", $no++);
            $sheet->setCellValue("C{$row}", $nom->nama);
            $sheet->setCellValue("D{$row}", (float) $nom->transport);
            $sheet->setCellValue("E{$row}", (float) $nom->uang_harian_vol);
            $sheet->setCellValue("F{$row}", (float) $nom->uang_harian_satuan);
            $sheet->setCellValue("G{$row}", (float) $nom->uang_harian_jumlah);
            $sheet->setCellValue("H{$row}", (float) $nom->fullboard_vol);
            $sheet->setCellValue("I{$row}", (float) $nom->fullboard_satuan);
            $sheet->setCellValue("J{$row}", (float) $nom->fullboard_jumlah);
            $sheet->setCellValue("K{$row}", (float) $nom->fullday_vol);
            $sheet->setCellValue("L{$row}", (float) $nom->fullday_satuan);
            $sheet->setCellValue("M{$row}", (float) $nom->fullday_jumlah);
            $sheet->setCellValue("N{$row}", (float) $nom->taksi_pp);
            $sheet->setCellValue("O{$row}", (float) $nom->tiket_pesawat);
            $sheet->setCellValue("P{$row}", (float) $nom->hotel);
            $sheet->setCellValue("Q{$row}", (float) $nom->jumlah_perjadin);
            $sheet->setCellValue("R{$row}", $nom->nama_rekening);
            $sheet->setCellValue("S{$row}", $nom->no_rekening);
            $sheet->setCellValue("T{$row}", $nom->nama_bank);
            $sheet->setCellValue("U{$row}", $nom->email);

            $sheet->getStyle("S{$row}")->getNumberFormat()->setFormatCode('@');
            $sheet->getStyle("D{$row}:Q{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $this->borderRow($sheet, "B{$row}:U{$row}");

            $totals['transport'] += (float) $nom->transport;
            $totals['biasa'] += (float) $nom->uang_harian_jumlah;
            $totals['fb'] += (float) $nom->fullboard_jumlah;
            $totals['fd'] += (float) $nom->fullday_jumlah;
            $totals['taksi'] += (float) $nom->taksi_pp;
            $totals['tiket'] += (float) $nom->tiket_pesawat;
            $totals['hotel'] += (float) $nom->hotel;
            $totals['diterima'] += (float) $nom->jumlah_perjadin;
            $row++;
        }

        // Baris jumlah
        $sheet->setCellValue("C{$row}", 'Jumlah');
        $sheet->setCellValue("D{$row}", $totals['transport']);
        $sheet->setCellValue("G{$row}", $totals['biasa']);
        $sheet->setCellValue("J{$row}", $totals['fb']);
        $sheet->setCellValue("M{$row}", $totals['fd']);
        $sheet->setCellValue("N{$row}", $totals['taksi']);
        $sheet->setCellValue("O{$row}", $totals['tiket']);
        $sheet->setCellValue("P{$row}", $totals['hotel']);
        $sheet->setCellValue("Q{$row}", $totals['diterima']);
        $sheet->getStyle("C{$row}:Q{$row}")->getFont()->setBold(true);
        $sheet->getStyle("D{$row}:Q{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $this->styleTotalRow($sheet, "B{$row}:U{$row}");

        $this->renderPerjadinFooter($sheet, $row, $totals['diterima'], true);
    }

    // ─── Format C2 — Perjadin Dalam Kota (524113 / 524114) ───────────────────

    private function renderPerjadinDalamKota($sheet, $nominatifRows, $judul, $kodeAkun, $namaItem): void
    {
        $lastCol = 'S';

        $sheet->mergeCells("A5:{$lastCol}5");
        $sheet->setCellValue('A5', 'DAFTAR PEMBAYARAN TRANSPORT DAN UANG HARIAN PERJALANAN DINAS');
        $sheet->getStyle('A5')->getFont()->setBold(true);
        $sheet->getStyle("A5:{$lastCol}5")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A6:{$lastCol}6");
        $sheet->setCellValue('A6', 'KEGIATAN '.strtoupper($this->pd->keperluan));
        $sheet->getStyle("A6:{$lastCol}6")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $tahun = $this->pd->tanggal_mulai ? substr($this->pd->tanggal_mulai, 0, 4) : now()->year;
        $sheet->mergeCells("A7:{$lastCol}7");
        $sheet->setCellValue('A7', "DI LINGKUNGAN LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III JAKARTA TAHUN ANGGARAN {$tahun}");
        $sheet->getStyle("A7:{$lastCol}7")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $tglPelaksanaan = '';
        if ($this->pd->tanggal_mulai && $this->pd->tanggal_selesai) {
            $tglMulai = $this->formatTanggalIndo($this->pd->tanggal_mulai);
            $tglSelesai = $this->formatTanggalIndo($this->pd->tanggal_selesai);
            $tglPelaksanaan = $tglMulai === $tglSelesai ? strtoupper($tglMulai) : strtoupper("{$tglMulai} S.D. {$tglSelesai}");
        }
        $sheet->mergeCells("A8:{$lastCol}8");
        $sheet->setCellValue('A8', 'DI '.strtoupper($this->pd->tempat ?? 'JAKARTA')." TANGGAL {$tglPelaksanaan}");
        $sheet->getStyle("A8:{$lastCol}8")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A9:{$lastCol}9");
        $sheet->setCellValue('A9', "{$kodeAkun} {$namaItem}");
        $sheet->getStyle("A9:{$lastCol}9")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells("A10:{$lastCol}10");
        $sheet->setCellValue('A10', '');

        $this->setColumnWidthsPerjadinDalam($sheet);

        // Header baris 11-12
        $sheet->mergeCells('B11:B12'); $sheet->setCellValue('B11', 'No');
        $sheet->mergeCells('C11:C12'); $sheet->setCellValue('C11', 'Nama');
        $sheet->mergeCells('D11:D12'); $sheet->setCellValue('D11', 'Transport (Rp.)');
        $sheet->mergeCells('E11:G11'); $sheet->setCellValue('E11', 'Uang Harian Biasa');
        $sheet->setCellValue('E12', 'Jml Hari');
        $sheet->setCellValue('F12', 'Satuan');
        $sheet->setCellValue('G12', 'Jumlah');
        $sheet->mergeCells('H11:J11'); $sheet->setCellValue('H11', 'Uang Harian Fullboard');
        $sheet->setCellValue('H12', 'Jml Hari');
        $sheet->setCellValue('I12', 'Satuan');
        $sheet->setCellValue('J12', 'Jumlah');
        $sheet->mergeCells('K11:M11'); $sheet->setCellValue('K11', 'Uang Harian Fullday');
        $sheet->setCellValue('K12', 'Jml Hari');
        $sheet->setCellValue('L12', 'Satuan');
        $sheet->setCellValue('M12', 'Jumlah');
        $sheet->mergeCells('N11:N12'); $sheet->setCellValue('N11', 'Akomodasi Hotel');
        $sheet->mergeCells('O11:O12'); $sheet->setCellValue('O11', 'Jumlah Diterima (Rp.)');
        $sheet->mergeCells('P11:P12'); $sheet->setCellValue('P11', 'Atas Nama Rekening');
        $sheet->mergeCells('Q11:Q12'); $sheet->setCellValue('Q11', 'Nomor Rekening');
        $sheet->mergeCells('R11:R12'); $sheet->setCellValue('R11', 'Bank');
        $sheet->mergeCells('S11:S12'); $sheet->setCellValue('S11', 'Email');

        $this->styleHeaderRange($sheet, 'B11:S12');
        $sheet->getRowDimension(11)->setRowHeight(35);
        $sheet->getRowDimension(12)->setRowHeight(20);

        // Formula row 13
        $sheet->setCellValue('B13', 'A');
        $sheet->setCellValue('C13', 'B');
        $sheet->setCellValue('D13', 'C');
        $sheet->setCellValue('E13', 'D');
        $sheet->setCellValue('F13', 'E');
        $sheet->setCellValue('G13', 'F = D x E');
        $sheet->setCellValue('H13', 'G');
        $sheet->setCellValue('I13', 'H ');
        $sheet->setCellValue('J13', 'I = G x H');
        $sheet->setCellValue('K13', 'J');
        $sheet->setCellValue('L13', 'K');
        $sheet->setCellValue('M13', 'L = J x K');
        $sheet->setCellValue('N13', '');
        $sheet->setCellValue('O13', 'M = C + F + I + L');
        $sheet->setCellValue('P13', 'N');
        $sheet->setCellValue('Q13', 'O');
        $sheet->setCellValue('R13', 'P');
        $sheet->setCellValue('S13', 'Q');
        $sheet->getStyle('B13:S13')->getFont()->setItalic(true)->setSize(9);
        $sheet->getStyle('B13:S13')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $this->borderRow($sheet, 'B13:S13');

        // Thick border between formula and data
        $sheet->getStyle('B14:S14')->getBorders()->getTop()->setBorderStyle(Border::BORDER_THICK);

        // Data rows start at 14
        $row = 14;
        $no = 1;
        $totals = [
            'transport' => 0, 'biasa' => 0, 'fb' => 0, 'fd' => 0,
            'hotel' => 0, 'diterima' => 0,
        ];

        foreach ($nominatifRows as $nom) {
            $sheet->setCellValue("B{$row}", $no++);
            $sheet->setCellValue("C{$row}", $nom->nama);
            $sheet->setCellValue("D{$row}", (float) $nom->transport);
            $sheet->setCellValue("E{$row}", (float) $nom->uang_harian_vol);
            $sheet->setCellValue("F{$row}", (float) $nom->uang_harian_satuan);
            $sheet->setCellValue("G{$row}", (float) $nom->uang_harian_jumlah);
            $sheet->setCellValue("H{$row}", (float) $nom->fullboard_vol);
            $sheet->setCellValue("I{$row}", (float) $nom->fullboard_satuan);
            $sheet->setCellValue("J{$row}", (float) $nom->fullboard_jumlah);
            $sheet->setCellValue("K{$row}", (float) $nom->fullday_vol);
            $sheet->setCellValue("L{$row}", (float) $nom->fullday_satuan);
            $sheet->setCellValue("M{$row}", (float) $nom->fullday_jumlah);
            $sheet->setCellValue("N{$row}", (float) $nom->hotel);
            $sheet->setCellValue("O{$row}", (float) $nom->jumlah_perjadin);
            $sheet->setCellValue("P{$row}", $nom->nama_rekening);
            $sheet->setCellValue("Q{$row}", $nom->no_rekening);
            $sheet->setCellValue("R{$row}", $nom->nama_bank);
            $sheet->setCellValue("S{$row}", $nom->email);

            $sheet->getStyle("Q{$row}")->getNumberFormat()->setFormatCode('@');
            $sheet->getStyle("D{$row}:O{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $this->borderRow($sheet, "B{$row}:S{$row}");

            $totals['transport'] += (float) $nom->transport;
            $totals['biasa'] += (float) $nom->uang_harian_jumlah;
            $totals['fb'] += (float) $nom->fullboard_jumlah;
            $totals['fd'] += (float) $nom->fullday_jumlah;
            $totals['hotel'] += (float) $nom->hotel;
            $totals['diterima'] += (float) $nom->jumlah_perjadin;
            $row++;
        }

        // Baris jumlah
        $sheet->setCellValue("C{$row}", 'Jumlah');
        $sheet->setCellValue("D{$row}", $totals['transport']);
        $sheet->setCellValue("G{$row}", $totals['biasa']);
        $sheet->setCellValue("J{$row}", $totals['fb']);
        $sheet->setCellValue("M{$row}", $totals['fd']);
        $sheet->setCellValue("N{$row}", $totals['hotel']);
        $sheet->setCellValue("O{$row}", $totals['diterima']);
        $sheet->getStyle("C{$row}:O{$row}")->getFont()->setBold(true);
        $sheet->getStyle("D{$row}:O{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $this->styleTotalRow($sheet, "B{$row}:S{$row}");

        $this->renderPerjadinFooter($sheet, $row, $totals['diterima'], false);
    }

    // ─── Footers ──────────────────────────────────────────────────────────────

    private function renderHonorFooter($sheet, int $jumlahRow, float $total): void
    {
        $r = $jumlahRow + 1;

        $lastCol = 'P';
        $sheet->mergeCells("B{$r}:{$lastCol}{$r}");
        $sheet->setCellValue("B{$r}", 'Terbilang   : '.$this->terbilang((int) $total).' Rupiah');
        $sheet->getStyle("B{$r}")->getFont()->setItalic(true);
        $this->styleTotalRow($sheet, "A{$r}:{$lastCol}{$r}");
        $r += 2;

        $sheet->setCellValue("A{$r}", '* Sesuai Tarif PPh 21 UU No. 36 Pasal 17 (1)a Tahun 2008 Tentang Pajak Penghasilan');
        $sheet->getStyle("A{$r}")->getFont()->setSize(9);
        $r++;
        $sheet->setCellValue("A{$r}", '** Sesuai PMK No. 252/PMK/03/2008 Pasal 20 Ayat 1 Tentang Petunjuk Pelaksanaan Pemotongan Pajak atas Penghasilan Sehubungan Pekerjaan, Jasa, dan Kegiatan Orang Pribadi');
        $sheet->getStyle("A{$r}")->getFont()->setSize(9);
        $r += 2;

        $sheet->setCellValue("A{$r}", "Jakarta, {$this->tglNominatif}");
        $r++;
        $sheet->setCellValue("A{$r}", 'Mengetahui/Menyetujui');
        $sheet->setCellValue("M{$r}", 'Lunas dibayar tanggal:');
        $r++;
        $sheet->setCellValue("A{$r}", 'an. Kuasa Pengguna Anggaran');
        $sheet->setCellValue("M{$r}", 'Bendahara Pengeluaran,');
        $r++;
        $sheet->setCellValue("A{$r}", 'Pejabat Pembuat Komitmen');
        $r += 4;
        $sheet->setCellValue("A{$r}", $this->ppk?->nama_lengkap ?? '___________________________');
        $sheet->setCellValue("M{$r}", $this->bendahara?->nama_lengkap ?? '___________________________');
        $sheet->getStyle("A{$r}")->getFont()->setBold(true);
        $sheet->getStyle("M{$r}")->getFont()->setBold(true);
        $r++;
        $sheet->setCellValue("A{$r}", 'NIP. '.($this->ppk?->nip ?? '-'));
        $sheet->setCellValue("M{$r}", 'NIP. '.($this->bendahara?->nip ?? '-'));
    }

    private function renderPerjadinFooter($sheet, int $jumlahRow, float $total, bool $isLuarKota): void
    {
        $r = $jumlahRow + 1;

        $lastCol = $isLuarKota ? 'U' : 'S';
        $colBendahara = $isLuarKota ? 'S' : 'Q';

        $sheet->mergeCells("C{$r}:{$lastCol}{$r}");
        $sheet->setCellValue("C{$r}", 'Terbilang   : '.$this->terbilang((int) $total).' Rupiah');
        $sheet->getStyle("C{$r}")->getFont()->setItalic(true);
        $this->styleTotalRow($sheet, "B{$r}:{$lastCol}{$r}");
        $r += 2;

        $sheet->setCellValue("B{$r}", '* Sesuai Tarif PPh 21 UU No. 36 Pasal 17 (1)a Tahun 2008 Tentang Pajak Penghasilan');
        $sheet->getStyle("B{$r}")->getFont()->setSize(9);
        $r++;
        $sheet->setCellValue("B{$r}", '** Sesuai PMK No. 252/PMK/03/2008 Pasal 20 Ayat 1 Tentang Petunjuk Pelaksanaan Pemotongan Pajak atas Penghasilan Sehubungan Pekerjaan, Jasa, dan Kegiatan Orang Pribadi');
        $sheet->getStyle("B{$r}")->getFont()->setSize(9);
        $r += 2;

        $sheet->setCellValue("B{$r}", "Jakarta, {$this->tglNominatif}");
        $r++;
        $sheet->setCellValue("B{$r}", 'Mengetahui/Menyetujui');
        $sheet->setCellValue("{$colBendahara}{$r}", 'Lunas dibayar tanggal:');
        $r++;
        $sheet->setCellValue("B{$r}", 'an. Kuasa Pengguna Anggaran');
        $sheet->setCellValue("{$colBendahara}{$r}", 'Bendahara Pengeluaran,');
        $r++;
        $sheet->setCellValue("B{$r}", 'Pejabat Pembuat Komitmen');
        $r += 4;
        $sheet->setCellValue("B{$r}", $this->ppk?->nama_lengkap ?? '___________________________');
        $sheet->setCellValue("{$colBendahara}{$r}", $this->bendahara?->nama_lengkap ?? '___________________________');
        $sheet->getStyle("B{$r}")->getFont()->setBold(true);
        $sheet->getStyle("{$colBendahara}{$r}")->getFont()->setBold(true);
        $r++;
        $sheet->setCellValue("B{$r}", 'NIP. '.($this->ppk?->nip ?? '-'));
        $sheet->setCellValue("{$colBendahara}{$r}", 'NIP. '.($this->bendahara?->nip ?? '-'));
    }

    // ─── Column widths ───────────────────────────────────────────────────────

    private function setColumnWidthsHonorA($sheet): void
    {
        $w = ['A' => 4, 'B' => 28, 'C' => 20, 'D' => 20, 'E' => 8, 'F' => 10, 'G' => 12, 'H' => 12, 'I' => 16, 'J' => 10, 'K' => 12, 'L' => 14, 'M' => 24, 'N' => 18, 'O' => 12, 'P' => 28];
        foreach ($w as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }
    }

    private function setColumnWidthsHonorB($sheet): void
    {
        $w = ['A' => 4, 'B' => 26, 'C' => 20, 'D' => 20, 'E' => 20, 'F' => 8, 'G' => 10, 'H' => 12, 'I' => 12, 'J' => 16, 'K' => 10, 'L' => 12, 'M' => 14, 'N' => 24, 'O' => 18, 'P' => 12, 'Q' => 28];
        foreach ($w as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }
    }

    private function setColumnWidthsPerjadinLuar($sheet): void
    {
        $w = ['A' => 3, 'B' => 4, 'C' => 28, 'D' => 14, 'E' => 10, 'F' => 12, 'G' => 12, 'H' => 10, 'I' => 12, 'J' => 12, 'K' => 10, 'L' => 12, 'M' => 12, 'N' => 12, 'O' => 14, 'P' => 16, 'Q' => 18, 'R' => 24, 'S' => 18, 'T' => 12, 'U' => 28];
        foreach ($w as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }
    }

    private function setColumnWidthsPerjadinDalam($sheet): void
    {
        $w = ['A' => 3, 'B' => 4, 'C' => 28, 'D' => 14, 'E' => 10, 'F' => 12, 'G' => 12, 'H' => 10, 'I' => 12, 'J' => 12, 'K' => 10, 'L' => 12, 'M' => 12, 'N' => 16, 'O' => 18, 'P' => 24, 'Q' => 18, 'R' => 12, 'S' => 28];
        foreach ($w as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }
    }

    // ─── Style helpers ──────────────────────────────────────────────────────

    private function styleHeaderRange($sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => ['bold' => true, 'name' => 'Times New Roman', 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'BDD7EE']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ]);
    }

    private function styleTotalRow($sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'BDD7EE']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ]);
    }

    private function borderRow($sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ]);
    }

    // ─── Page setup ─────────────────────────────────────────────────────────

    private function setupPage($sheet): void
    {
        $sheet->getPageSetup()
            ->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE)
            ->setFitToWidth(1)
            ->setFitToHeight(0);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function formatTanggalIndo($date): string
    {
        $bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $d = is_string($date) ? new \DateTime($date) : $date;

        return $d->format('d').' '.$bulan[(int) $d->format('n')].' '.$d->format('Y');
    }

    private function terbilang(int $angka): string
    {
        if ($angka < 0) {
            return 'minus '.$this->terbilang(abs($angka));
        }
        if ($angka === 0) {
            return 'nol';
        }

        $satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
            'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
            'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];

        if ($angka < 20) {
            return $satuan[$angka];
        }
        if ($angka < 100) {
            $sisa = $angka % 10;

            return $satuan[(int) ($angka / 10)].' puluh'.($sisa ? ' '.$satuan[$sisa] : '');
        }
        if ($angka < 200) {
            return 'seratus'.($angka - 100 > 0 ? ' '.$this->terbilang($angka - 100) : '');
        }
        if ($angka < 1000) {
            $sisa = $angka % 100;

            return $satuan[(int) ($angka / 100)].' ratus'.($sisa ? ' '.$this->terbilang($sisa) : '');
        }
        if ($angka < 2000) {
            return 'seribu'.($angka - 1000 > 0 ? ' '.$this->terbilang($angka - 1000) : '');
        }
        if ($angka < 1_000_000) {
            $ribuan = (int) ($angka / 1000);
            $sisa = $angka % 1000;

            return $this->terbilang($ribuan).' ribu'.($sisa ? ' '.$this->terbilang($sisa) : '');
        }
        if ($angka < 1_000_000_000) {
            $juta = (int) ($angka / 1_000_000);
            $sisa = $angka % 1_000_000;

            return $this->terbilang($juta).' juta'.($sisa ? ' '.$this->terbilang($sisa) : '');
        }
        $miliar = (int) ($angka / 1_000_000_000);
        $sisa = $angka % 1_000_000_000;

        return $this->terbilang($miliar).' miliar'.($sisa ? ' '.$this->terbilang($sisa) : '');
    }
}
