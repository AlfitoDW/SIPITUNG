<?php

namespace App\Http\Controllers\Bendahara;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Bendahara — Step 5 (Pencairan)
 *
 * pic_approved → dicairkan
 */
class PermohonanDanaController extends Controller
{
    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $siapCair = PermohonanDana::with(['items', 'timKerja', 'createdBy', 'picApprovedBy'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', 'pic_approved')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($pd) => array_merge($pd->toArray(), ['status_label' => $pd->status_label]));

        $riwayat = PermohonanDana::with(['items', 'timKerja', 'createdBy'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', 'dicairkan')
            ->orderByDesc('dicairkan_at')
            ->get()
            ->map(fn ($pd) => array_merge($pd->toArray(), ['status_label' => $pd->status_label]));

        return Inertia::render('Bendahara/PermohonanDana/Index', [
            'tahun'    => $tahun,
            'siapCair' => $siapCair,
            'riwayat'  => $riwayat,
        ]);
    }

    public function cairkan(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'pic_approved', 422, 'Hanya permohonan berstatus Diverifikasi PIC yang dapat dicairkan.');

        $request->validate(['catatan' => 'nullable|string|max:1000']);

        $pd->update([
            'status'           => 'dicairkan',
            'dicairkan_by'     => $request->user()->id,
            'catatan_pencairan' => $request->catatan,
            'dicairkan_at'     => now(),
        ]);

        return back()->with('success', "Dana untuk permohonan {$pd->nomor_permohonan} berhasil dicairkan.");
    }

    // ─── Download Daftar Nominatif ────────────────────────────────────────────────

    public function nominatif(PermohonanDana $pd)
    {
        abort_if(!in_array($pd->status, ['pic_approved', 'dicairkan']), 403, 'Nominatif hanya tersedia setelah diverifikasi PIC.');

        $pd->load([
            'items.nominatif',
            'items.djaRincianBiaya',
            'timKerja',
            'djaKegiatan',
            'ppkApprovedBy',
        ]);

        $ppk        = $pd->ppkApprovedBy;
        $bendahara  = User::where('role', 'bendahara')->where('is_active', true)->first();
        $tglNominatif = $pd->tgl_nominatif
            ? $pd->tgl_nominatif->locale('id')->isoFormat('D MMMM YYYY')
            : now()->locale('id')->isoFormat('D MMMM YYYY');

        $tahun = $pd->tanggal_mulai ? substr($pd->tanggal_mulai, 0, 4) : now()->year;

        // Kelompokkan items berdasarkan kode_akun (hanya yang honor atau perjadin)
        $honorAkun   = ['521115', '521213', '522151'];
        $perjadinAkun = ['524111', '524119', '524113'];
        $allNominatifAkun = array_merge($honorAkun, $perjadinAkun);

        $grouped = $pd->items
            ->filter(fn ($item) => in_array($item->kode_akun, $allNominatifAkun))
            ->groupBy('kode_akun');

        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $sheetIdx = 0;
        foreach ($grouped as $kodeAkun => $items) {
            $isHonor   = in_array($kodeAkun, $honorAkun);
            $isPerjadin = in_array($kodeAkun, $perjadinAkun);

            $sheet = $spreadsheet->createSheet($sheetIdx++);
            $sheet->setTitle(substr($kodeAkun, 0, 31));

            // Tab color
            if ($isHonor) {
                $sheet->getTabColor()->setRGB('F4B084');
            } else {
                $sheet->getTabColor()->setRGB('00B0F0');
            }

            // ── Judul sheet ──────────────────────────────────────────────────
            $judul = match ($kodeAkun) {
                '521213' => 'DAFTAR PEMBAYARAN HONORARIUM PANITIA',
                '522151' => 'DAFTAR PEMBAYARAN HONORARIUM NARASUMBER DAN MODERATOR',
                '521115' => 'DAFTAR PEMBAYARAN HONORARIUM OPERASIONAL SATUAN KERJA',
                '524111' => 'DAFTAR PERJALANAN DINAS BIASA (LUAR KOTA)',
                '524119' => 'DAFTAR PERJALANAN DINAS PAKET MEETING (LUAR KOTA)',
                '524113' => 'DAFTAR PERJALANAN DINAS DALAM KOTA',
                default  => strtoupper($kodeAkun),
            };

            $firstItem = $items->first();
            $namaItem  = $firstItem->djaRincianBiaya?->nama_item ?? $firstItem->uraian ?? '-';
            $noSk      = $pd->no_sk ?? '-';
            $tglSk     = $pd->tgl_sk ? $this->formatTanggalIndo($pd->tgl_sk) : '-';
            $noSt      = $pd->no_st ?? '-';
            $tglSt     = $pd->tgl_st ? $this->formatTanggalIndo($pd->tgl_st) : '-';
            $nomorSurat = $isHonor ? "Nomor : {$noSk} Tanggal {$tglSk}" : "Nomor : {$noSt} Tanggal {$tglSt}";

            $tglPelaksanaan = '';
            if ($pd->tanggal_mulai && $pd->tanggal_selesai) {
                $tglMulai   = $this->formatTanggalIndo($pd->tanggal_mulai);
                $tglSelesai = $this->formatTanggalIndo($pd->tanggal_selesai);
                $tglPelaksanaan = $tglMulai === $tglSelesai ? strtoupper($tglMulai) : strtoupper("{$tglMulai} S.D. {$tglSelesai}");
            }

            // ── Header baris 1–9 ─────────────────────────────────────────────
            $sheet->setCellValue('A1', 'Lampiran :');
            $sheet->setCellValue('A2', 'Surat Keputusan Kepala LLDIKTI Wilayah III selaku KPA');
            $sheet->setCellValue('A3', $nomorSurat);
            $sheet->setCellValue('A5', "DAFTAR PEMBAYARAN {$judul}");
            $sheet->setCellValue('A6', 'KEGIATAN ' . strtoupper($pd->keperluan));
            $sheet->setCellValue('A7', "DI LINGKUNGAN LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III JAKARTA TAHUN ANGGARAN {$tahun}");
            $sheet->setCellValue('A8', "DI " . strtoupper($pd->tempat ?? 'JAKARTA') . " TANGGAL {$tglPelaksanaan}");
            $sheet->setCellValue('A9', "{$kodeAkun} {$namaItem}");

            $sheet->getStyle('A5')->getFont()->setBold(true);
            $sheet->getStyle('A6')->getFont()->setBold(true);

            // ── Kumpulkan semua baris nominatif untuk kode akun ini ──────────
            $allNominatif = collect();
            foreach ($items as $item) {
                foreach ($item->nominatif as $nom) {
                    $allNominatif->push($nom);
                }
            }

            // ── Render per format ─────────────────────────────────────────────
            if ($kodeAkun === '521115') {
                $this->renderHonorFormatA($sheet, $allNominatif, $judul, $ppk, $bendahara, $tglNominatif);
            } elseif (in_array($kodeAkun, ['521213', '522151'])) {
                $this->renderHonorFormatB($sheet, $allNominatif, $judul, $ppk, $bendahara, $tglNominatif);
            } else {
                $this->renderPerjalananDinas($sheet, $allNominatif, $judul, $ppk, $bendahara, $tglNominatif);
            }

            // Page setup
            $sheet->getPageSetup()
                ->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE)
                ->setFitToWidth(1)
                ->setFitToHeight(0);
        }

        // Jika tidak ada nominatif akun, buat sheet fallback
        if ($sheetIdx === 0) {
            $sheet = $spreadsheet->createSheet(0);
            $sheet->setTitle('Nominatif');
            $sheet->setCellValue('A1', 'Belum ada data nominatif untuk permohonan ini.');
        }

        $spreadsheet->setActiveSheetIndex(0);

        $nomor    = str_replace('/', '-', $pd->nomor_permohonan);
        $filename = "Nominatif_{$nomor}.xlsx";
        $writer   = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'max-age=0',
        ]);
    }

    // ─── Format A — Honor 521115 (tanpa Jabatan) ─────────────────────────────

    private function renderHonorFormatA($sheet, $nominatifRows, $judul, $ppk, $bendahara, $tglNominatif): void
    {
        // Header baris 9-11 (Format A, 16 kolom: A-P)
        $headerStart = 11;
        $headers = [
            ['No', 'Nama', 'NIK', 'NPWP', 'Gol', 'Jml Keg', 'Rp/Keg', 'Jml Bruto',
             'PNS/Non PNS', 'Tarif PPh21', 'Jml Pajak', 'Jml Diterima',
             'Atas Nama Rekening', 'Nomor Rekening', 'Bank', 'Email'],
        ];

        $this->writeHeaders($sheet, $headerStart, $headers, 'P');

        // Merge header groups (baris 9-10)
        $sheet->mergeCells("A9:A10"); $sheet->setCellValue('A9', 'No');
        $sheet->mergeCells("B9:B10"); $sheet->setCellValue('B9', 'Nama');
        $sheet->mergeCells("C9:C10"); $sheet->setCellValue('C9', 'NIK');
        $sheet->mergeCells("D9:D10"); $sheet->setCellValue('D9', 'NPWP');
        $sheet->mergeCells("E9:E10"); $sheet->setCellValue('E9', 'Gol');
        $sheet->mergeCells("F9:H9"); $sheet->setCellValue('F9', 'Honorarium');
        $sheet->setCellValue('F10', 'Jml Keg'); $sheet->setCellValue('G10', 'Rp/Keg'); $sheet->setCellValue('H10', 'Jml Bruto');
        $sheet->mergeCells("I9:I10"); $sheet->setCellValue('I9', 'DPP PNS/Non PNS');
        $sheet->mergeCells("J9:K9"); $sheet->setCellValue('J9', 'PPh21');
        $sheet->setCellValue('J10', 'Tarif'); $sheet->setCellValue('K10', 'Jml Pajak');
        $sheet->mergeCells("L9:L10"); $sheet->setCellValue('L9', 'Jml Diterima');
        $sheet->mergeCells("M9:M10"); $sheet->setCellValue('M9', 'Atas Nama Rekening');
        $sheet->mergeCells("N9:N10"); $sheet->setCellValue('N9', 'Nomor Rekening');
        $sheet->mergeCells("O9:O10"); $sheet->setCellValue('O9', 'Bank');
        $sheet->mergeCells("P9:P10"); $sheet->setCellValue('P9', 'Email');

        $this->styleHeaderRange($sheet, 'A9:P10');

        // Data rows
        $row = 11;
        $no  = 1;
        $totalBruto = $totalPajak = $totalDiterima = 0;

        foreach ($nominatifRows as $nom) {
            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", $nom->nama);
            $sheet->setCellValue("C{$row}", $nom->nik);
            $sheet->setCellValue("D{$row}", $nom->npwp);
            $sheet->setCellValue("E{$row}", $nom->gol_ruang);
            $sheet->setCellValue("F{$row}", $nom->volume);
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
            $sheet->getStyle("G{$row}:H{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("K{$row}:L{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("J{$row}")->getNumberFormat()->setFormatCode('0.00%');
            $this->borderRow($sheet, "A{$row}:P{$row}");

            $totalBruto   += (float) $nom->jumlah_bruto;
            $totalPajak   += (float) $nom->jumlah_pajak;
            $totalDiterima += (float) $nom->jumlah_diterima;
            $row++;
        }

        // Baris jumlah
        $sheet->setCellValue("G{$row}", 'Jumlah');
        $sheet->setCellValue("H{$row}", $totalBruto);
        $sheet->setCellValue("K{$row}", $totalPajak);
        $sheet->setCellValue("L{$row}", $totalDiterima);
        $sheet->getStyle("G{$row}:L{$row}")->getFont()->setBold(true);
        $sheet->getStyle("H{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("K{$row}:L{$row}")->getNumberFormat()->setFormatCode('#,##0');

        $this->renderFooter($sheet, $row, 'P', $totalDiterima, $ppk, $bendahara, $tglNominatif);
    }

    // ─── Format B — Honor 521213/522151 (dengan Jabatan) ─────────────────────

    private function renderHonorFormatB($sheet, $nominatifRows, $judul, $ppk, $bendahara, $tglNominatif): void
    {
        // Header baris 11-13 (17 kolom: A-Q)
        $sheet->mergeCells("A11:A13"); $sheet->setCellValue('A11', 'No');
        $sheet->mergeCells("B11:B13"); $sheet->setCellValue('B11', 'Nama');
        $sheet->mergeCells("C11:C13"); $sheet->setCellValue('C11', 'Jabatan Dalam Tugas');
        $sheet->mergeCells("D11:D13"); $sheet->setCellValue('D11', 'NIK');
        $sheet->mergeCells("E11:E13"); $sheet->setCellValue('E11', 'NPWP');
        $sheet->mergeCells("F11:F13"); $sheet->setCellValue('F11', 'Gol');
        $sheet->mergeCells("G11:I11"); $sheet->setCellValue('G11', 'Honorarium');
        $sheet->mergeCells("G12:G13"); $sheet->setCellValue('G12', 'Jml Keg');
        $sheet->mergeCells("H12:H13"); $sheet->setCellValue('H12', 'Rp/Keg');
        $sheet->mergeCells("I12:I13"); $sheet->setCellValue('I12', 'Jml Bruto');
        $sheet->mergeCells("J11:J13"); $sheet->setCellValue('J11', 'DPP PNS/Non PNS');
        $sheet->mergeCells("K11:L11"); $sheet->setCellValue('K11', 'PPh21');
        $sheet->mergeCells("K12:K13"); $sheet->setCellValue('K12', 'Tarif');
        $sheet->mergeCells("L12:L13"); $sheet->setCellValue('L12', 'Jml Pajak');
        $sheet->mergeCells("M11:M13"); $sheet->setCellValue('M11', 'Jml Diterima');
        $sheet->mergeCells("N11:N13"); $sheet->setCellValue('N11', 'Atas Nama Rekening');
        $sheet->mergeCells("O11:O13"); $sheet->setCellValue('O11', 'Nomor Rekening');
        $sheet->mergeCells("P11:P13"); $sheet->setCellValue('P11', 'Bank');
        $sheet->mergeCells("Q11:Q13"); $sheet->setCellValue('Q11', 'Email');

        $this->styleHeaderRange($sheet, 'A11:Q13');

        $row = 14;
        $no  = 1;
        $totalBruto = $totalPajak = $totalDiterima = 0;

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
            $sheet->getStyle("H{$row}:I{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("L{$row}:M{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("K{$row}")->getNumberFormat()->setFormatCode('0.00%');
            $this->borderRow($sheet, "A{$row}:Q{$row}");

            $totalBruto   += (float) $nom->jumlah_bruto;
            $totalPajak   += (float) $nom->jumlah_pajak;
            $totalDiterima += (float) $nom->jumlah_diterima;
            $row++;
        }

        $sheet->setCellValue("H{$row}", 'Jumlah');
        $sheet->setCellValue("I{$row}", $totalBruto);
        $sheet->setCellValue("L{$row}", $totalPajak);
        $sheet->setCellValue("M{$row}", $totalDiterima);
        $sheet->getStyle("H{$row}:M{$row}")->getFont()->setBold(true);
        $sheet->getStyle("I{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("L{$row}:M{$row}")->getNumberFormat()->setFormatCode('#,##0');

        $this->renderFooter($sheet, $row, 'Q', $totalDiterima, $ppk, $bendahara, $tglNominatif);
    }

    // ─── Format C — Perjalanan Dinas ─────────────────────────────────────────

    private function renderPerjalananDinas($sheet, $nominatifRows, $judul, $ppk, $bendahara, $tglNominatif): void
    {
        // Header 11-13, 21 kolom: A-U
        $sheet->mergeCells("A11:A13"); $sheet->setCellValue('A11', 'No');
        $sheet->mergeCells("B11:B13"); $sheet->setCellValue('B11', 'Nama');
        $sheet->mergeCells("C11:C13"); $sheet->setCellValue('C11', 'Transport (Rp)');
        $sheet->mergeCells("D11:F11"); $sheet->setCellValue('D11', 'Uang Harian Biasa');
        $sheet->mergeCells("D12:D13"); $sheet->setCellValue('D12', 'Jml Hari');
        $sheet->mergeCells("E12:E13"); $sheet->setCellValue('E12', 'Satuan');
        $sheet->mergeCells("F12:F13"); $sheet->setCellValue('F12', 'Jumlah');
        $sheet->mergeCells("G11:I11"); $sheet->setCellValue('G11', 'Uang Harian Fullboard');
        $sheet->mergeCells("G12:G13"); $sheet->setCellValue('G12', 'Jml Hari');
        $sheet->mergeCells("H12:H13"); $sheet->setCellValue('H12', 'Satuan');
        $sheet->mergeCells("I12:I13"); $sheet->setCellValue('I12', 'Jumlah');
        $sheet->mergeCells("J11:L11"); $sheet->setCellValue('J11', 'Uang Harian Fullday');
        $sheet->mergeCells("J12:J13"); $sheet->setCellValue('J12', 'Jml Hari');
        $sheet->mergeCells("K12:K13"); $sheet->setCellValue('K12', 'Satuan');
        $sheet->mergeCells("L12:L13"); $sheet->setCellValue('L12', 'Jumlah');
        $sheet->mergeCells("M11:M13"); $sheet->setCellValue('M11', 'Uang Representasi');
        $sheet->mergeCells("N11:N13"); $sheet->setCellValue('N11', 'Taksi PP');
        $sheet->mergeCells("O11:O13"); $sheet->setCellValue('O11', 'Tiket Pesawat');
        $sheet->mergeCells("P11:P13"); $sheet->setCellValue('P11', 'Akomodasi Hotel');
        $sheet->mergeCells("Q11:Q13"); $sheet->setCellValue('Q11', 'Jml Diterima (Rp)');
        $sheet->mergeCells("R11:R13"); $sheet->setCellValue('R11', 'Atas Nama Rekening');
        $sheet->mergeCells("S11:S13"); $sheet->setCellValue('S11', 'Nomor Rekening');
        $sheet->mergeCells("T11:T13"); $sheet->setCellValue('T11', 'Bank');
        $sheet->mergeCells("U11:U13"); $sheet->setCellValue('U11', 'Email');

        $this->styleHeaderRange($sheet, 'A11:U13');

        $row   = 14;
        $no    = 1;
        $total = 0;

        foreach ($nominatifRows as $nom) {
            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", $nom->nama);
            $sheet->setCellValue("C{$row}", (float) $nom->transport);
            $sheet->setCellValue("D{$row}", (float) $nom->uang_harian_vol);
            $sheet->setCellValue("E{$row}", (float) $nom->uang_harian_satuan);
            $sheet->setCellValue("F{$row}", (float) $nom->uang_harian_jumlah);
            $sheet->setCellValue("G{$row}", (float) $nom->fullboard_vol);
            $sheet->setCellValue("H{$row}", (float) $nom->fullboard_satuan);
            $sheet->setCellValue("I{$row}", (float) $nom->fullboard_jumlah);
            $sheet->setCellValue("J{$row}", (float) $nom->fullday_vol);
            $sheet->setCellValue("K{$row}", (float) $nom->fullday_satuan);
            $sheet->setCellValue("L{$row}", (float) $nom->fullday_jumlah);
            $sheet->setCellValue("M{$row}", (float) $nom->representasi);
            $sheet->setCellValue("N{$row}", (float) $nom->taksi_pp);
            $sheet->setCellValue("O{$row}", (float) $nom->tiket_pesawat);
            $sheet->setCellValue("P{$row}", (float) $nom->hotel);
            $sheet->setCellValue("Q{$row}", (float) $nom->jumlah_perjadin);
            $sheet->setCellValue("R{$row}", $nom->nama_rekening);
            $sheet->setCellValue("S{$row}", $nom->no_rekening);
            $sheet->setCellValue("T{$row}", $nom->nama_bank);
            $sheet->setCellValue("U{$row}", $nom->email);

            $sheet->getStyle("S{$row}")->getNumberFormat()->setFormatCode('@');
            $sheet->getStyle("C{$row}:Q{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $this->borderRow($sheet, "A{$row}:U{$row}");

            $total += (float) $nom->jumlah_perjadin;
            $row++;
        }

        $sheet->setCellValue("P{$row}", 'Jumlah');
        $sheet->setCellValue("Q{$row}", $total);
        $sheet->getStyle("P{$row}:Q{$row}")->getFont()->setBold(true);
        $sheet->getStyle("Q{$row}")->getNumberFormat()->setFormatCode('#,##0');

        $this->renderFooter($sheet, $row, 'U', $total, $ppk, $bendahara, $tglNominatif);
    }

    // ─── Footer (tanda tangan) ───────────────────────────────────────────────

    private function renderFooter($sheet, int $jumlahRow, string $lastCol, float $total, $ppk, $bendahara, string $tglNominatif): void
    {
        $r = $jumlahRow + 1;

        // Terbilang
        $sheet->setCellValue("A{$r}", 'Terbilang : ' . $this->terbilang((int) $total) . ' Rupiah');
        $sheet->getStyle("A{$r}")->getFont()->setItalic(true);
        $r += 3;

        $sheet->setCellValue("A{$r}", 'Keterangan: Tarif PPh21 sesuai golongan/status kepegawaian.');
        $r++;
        $sheet->setCellValue("A{$r}", 'PMK berlaku tentang pajak penghasilan bagi pejabat negara, PNS, dan TNI/Polri.');
        $r += 2;

        $sheet->setCellValue("A{$r}", "Jakarta, {$tglNominatif}");
        $r++;
        $sheet->setCellValue("A{$r}", 'Mengetahui/Menyetujui');

        // Tentukan kolom tanda tangan bendahara (kira-kira di tengah ke kanan)
        $colBendahara = chr(ord('A') + intdiv(ord($lastCol) - ord('A'), 2) + 2);

        $sheet->setCellValue("{$colBendahara}{$r}", 'Lunas dibayar tanggal:');
        $r++;
        $sheet->setCellValue("A{$r}", 'an. Kuasa Pengguna Anggaran');
        $sheet->setCellValue("{$colBendahara}{$r}", 'Bendahara Pengeluaran,');
        $r++;
        $sheet->setCellValue("A{$r}", 'Pejabat Pembuat Komitmen');
        $r += 4;
        $sheet->setCellValue("A{$r}", $ppk?->nama_lengkap ?? '___________________________');
        $sheet->setCellValue("{$colBendahara}{$r}", $bendahara?->nama_lengkap ?? '___________________________');
        $sheet->getStyle("A{$r}")->getFont()->setBold(true);
        $sheet->getStyle("{$colBendahara}{$r}")->getFont()->setBold(true);
        $r++;
        $sheet->setCellValue("A{$r}", 'NIP. ' . ($ppk?->nip ?? '-'));
        $sheet->setCellValue("{$colBendahara}{$r}", 'NIP. ' . ($bendahara?->nip ?? '-'));
    }

    // ─── Style helpers ────────────────────────────────────────────────────────

    private function writeHeaders($sheet, int $startRow, array $headerRows, string $lastCol): void
    {
        foreach ($headerRows as $i => $cols) {
            $col = 'A';
            foreach ($cols as $h) {
                $sheet->setCellValue("{$col}" . ($startRow + $i), $h);
                $col++;
            }
        }
    }

    private function styleHeaderRange($sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font'      => ['bold' => true, 'name' => 'Times New Roman', 'size' => 10],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'BDD7EE']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ]);
    }

    private function borderRow($sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ]);
    }

    // ─── Helper: format tanggal Indonesia ────────────────────────────────────

    private function formatTanggalIndo($date): string
    {
        $bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $d = is_string($date) ? new \DateTime($date) : $date;
        return $d->format('d') . ' ' . $bulan[(int) $d->format('n')] . ' ' . $d->format('Y');
    }

    // ─── Helper: terbilang ────────────────────────────────────────────────────

    private function terbilang(int $angka): string
    {
        if ($angka < 0) return 'minus ' . $this->terbilang(abs($angka));
        if ($angka === 0) return 'nol';

        $satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
                   'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
                   'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];

        if ($angka < 20) return $satuan[$angka];
        if ($angka < 100) {
            $sisa = $angka % 10;
            return $satuan[(int) ($angka / 10)] . ' puluh' . ($sisa ? ' ' . $satuan[$sisa] : '');
        }
        if ($angka < 200) return 'seratus' . ($angka - 100 > 0 ? ' ' . $this->terbilang($angka - 100) : '');
        if ($angka < 1000) {
            $sisa = $angka % 100;
            return $satuan[(int) ($angka / 100)] . ' ratus' . ($sisa ? ' ' . $this->terbilang($sisa) : '');
        }
        if ($angka < 2000) return 'seribu' . ($angka - 1000 > 0 ? ' ' . $this->terbilang($angka - 1000) : '');
        if ($angka < 1_000_000) {
            $ribuan = (int) ($angka / 1000);
            $sisa   = $angka % 1000;
            return $this->terbilang($ribuan) . ' ribu' . ($sisa ? ' ' . $this->terbilang($sisa) : '');
        }
        if ($angka < 1_000_000_000) {
            $juta = (int) ($angka / 1_000_000);
            $sisa = $angka % 1_000_000;
            return $this->terbilang($juta) . ' juta' . ($sisa ? ' ' . $this->terbilang($sisa) : '');
        }
        $miliar = (int) ($angka / 1_000_000_000);
        $sisa   = $angka % 1_000_000_000;
        return $this->terbilang($miliar) . ' miliar' . ($sisa ? ' ' . $this->terbilang($sisa) : '');
    }
}
