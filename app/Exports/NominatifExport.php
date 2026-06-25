<?php

namespace App\Exports;

use App\Models\PermohonanDana;
use App\Models\User;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class NominatifExport
{
    private PermohonanDana $pd;

    private ?User $ppk;

    private ?User $bendahara;

    private ?User $picKeuangan;

    private string $tglNominatif;

    private const HONOR_AKUN = ['521115', '521213', '522151'];

    private const PERJADIN_LUAR_AKUN = ['524111', '524119'];

    private const PERJADIN_DALAM_AKUN = ['524113', '524114'];

    private const ALL_AKUN = ['521115', '521213', '522151', '524111', '524113', '524114', '524119'];

    private const SHEET_MAP = [
        '521115' => '521115',
        '521213' => '521213',
        '522151' => '522151',
        '524111' => '524111',
        '524113' => '524113',
        '524114' => '524114',
        '524119' => '524119',
    ];

    private const CONFIG = [
        '521115' => [
            'format' => 'A',
            'dataStartRow' => 12,
            'dataEndRow' => 14,
            'jumlahRow' => 16,
            'terbilangRow' => 17,
            'jakartaRow' => 22,
            'mengetahuiRow' => 23,
            'anKuasaRow' => 24,
            'pejabatRow' => 25,
            'ppkNameRow' => 29,
            'ppkNipRow' => 30,
            'lastCol' => 'P',
            'headerStartCol' => 'A',
            'headerEndCol' => 'P',
            'footerStartCol' => 'A',
            'footerEndCol' => 'P',
            'picMidCol' => 'G',
        ],
        '521213' => [
            'format' => 'B',
            'dataStartRow' => 14,
            'dataEndRow' => 16,
            'jumlahRow' => 18,
            'terbilangRow' => 19,
            'jakartaRow' => 24,
            'mengetahuiRow' => 25,
            'anKuasaRow' => 26,
            'pejabatRow' => 27,
            'ppkNameRow' => 31,
            'ppkNipRow' => 32,
            'lastCol' => 'Q',
            'headerStartCol' => 'A',
            'headerEndCol' => 'Q',
            'footerStartCol' => 'A',
            'footerEndCol' => 'Q',
            'picMidCol' => 'G',
        ],
        '522151' => [
            'format' => 'B',
            'dataStartRow' => 14,
            'dataEndRow' => 16,
            'jumlahRow' => 18,
            'terbilangRow' => 19,
            'jakartaRow' => 24,
            'mengetahuiRow' => 25,
            'anKuasaRow' => 26,
            'pejabatRow' => 27,
            'ppkNameRow' => 31,
            'ppkNipRow' => 32,
            'lastCol' => 'Q',
            'headerStartCol' => 'A',
            'headerEndCol' => 'Q',
            'footerStartCol' => 'A',
            'footerEndCol' => 'Q',
            'picMidCol' => 'G',
        ],
        '524111' => [
            'format' => 'C',
            'dataStartRow' => 14,
            'dataEndRow' => 44,
            'jumlahRow' => 45,
            'terbilangRow' => 46,
            'jakartaRow' => 48,
            'mengetahuiRow' => 49,
            'anKuasaRow' => 50,
            'pejabatRow' => 51,
            'ppkNameRow' => 55,
            'ppkNipRow' => 56,
            'lastCol' => 'U',
            'headerStartCol' => 'B',
            'headerEndCol' => 'U',
            'footerStartCol' => 'B',
            'footerEndCol' => 'U',
            'picMidCol' => 'J',
        ],
        '524114' => [
            'format' => 'C',
            'dataStartRow' => 14,
            'dataEndRow' => 43,
            'jumlahRow' => 44,
            'terbilangRow' => 45,
            'jakartaRow' => 47,
            'mengetahuiRow' => 48,
            'anKuasaRow' => 49,
            'pejabatRow' => 50,
            'ppkNameRow' => 54,
            'ppkNipRow' => 55,
            'lastCol' => 'S',
            'headerStartCol' => 'B',
            'headerEndCol' => 'S',
            'footerStartCol' => 'B',
            'footerEndCol' => 'S',
            'picMidCol' => 'I',
        ],
        '524113' => [
            'format' => 'C',
            'dataStartRow' => 14,
            'dataEndRow' => 43,
            'jumlahRow' => 44,
            'terbilangRow' => 45,
            'jakartaRow' => 47,
            'mengetahuiRow' => 48,
            'anKuasaRow' => 49,
            'pejabatRow' => 50,
            'ppkNameRow' => 54,
            'ppkNipRow' => 55,
            'lastCol' => 'S',
            'headerStartCol' => 'B',
            'headerEndCol' => 'S',
            'footerStartCol' => 'B',
            'footerEndCol' => 'S',
            'picMidCol' => 'I',
        ],
        '524119' => [
            'format' => 'C',
            'dataStartRow' => 14,
            'dataEndRow' => 44,
            'jumlahRow' => 45,
            'terbilangRow' => 46,
            'jakartaRow' => 48,
            'mengetahuiRow' => 49,
            'anKuasaRow' => 50,
            'pejabatRow' => 51,
            'ppkNameRow' => 55,
            'ppkNipRow' => 56,
            'lastCol' => 'U',
            'headerStartCol' => 'B',
            'headerEndCol' => 'U',
            'footerStartCol' => 'B',
            'footerEndCol' => 'U',
            'picMidCol' => 'J',
        ],
    ];

    public function __construct(PermohonanDana $pd)
    {
        $this->pd = $pd;
        $this->pd->load(['items.nominatif', 'items.djaRincianBiaya', 'timKerja', 'djaKegiatan', 'ppkApprovedBy', 'picKeuangan']);
        $this->ppk = $this->pd->ppkApprovedBy;
        $this->bendahara = User::where('role', 'bendahara')->where('is_active', true)->first();
        $this->picKeuangan = $this->pd->picKeuangan;
        $this->tglNominatif = $this->pd->tgl_nominatif
            ? $this->pd->tgl_nominatif->locale('id')->isoFormat('D MMMM YYYY')
            : now()->locale('id')->isoFormat('D MMMM YYYY');
    }

    public function download(): \Illuminate\Http\Response
    {
        $templatePath = storage_path('app/templates/nominatif_template_clean.xlsx');
        if (! file_exists($templatePath)) {
            abort(500, 'Template nominatif tidak ditemukan.');
        }

        $spreadsheet = IOFactory::load($templatePath);
        $grouped = $this->pd->items->filter(fn ($i) => in_array($i->kode_akun, self::ALL_AKUN))->groupBy('kode_akun');

        $usedSheetNames = [];
        foreach ($grouped as $kodeAkun => $items) {
            $kodeAkun = (string) $kodeAkun;
            $sheetName = self::SHEET_MAP[$kodeAkun] ?? null;
            if (! $sheetName) {
                continue;
            }

            $sheet = $spreadsheet->getSheetByName($sheetName);
            if (! $sheet) {
                continue;
            }

            $allNominatif = collect();
            foreach ($items as $item) {
                foreach ($item->nominatif as $nom) {
                    $allNominatif->push($nom);
                }
            }

            if (! in_array($kodeAkun, self::HONOR_AKUN)) {
                $allNominatif = $this->mergePerjadinPerOrang($allNominatif);
            }

            $namaItem = $items->first()->djaRincianBiaya?->nama_item ?? $items->first()->uraian ?? '';
            $this->processSheet($sheet, $kodeAkun, $allNominatif, $namaItem);
            $usedSheetNames[] = $sheetName;
        }

        // Remove unused sheets (hanya yang ada data yang tersisa)
        $sheetNames = $spreadsheet->getSheetNames();
        for ($i = count($sheetNames) - 1; $i >= 0; $i--) {
            $sheetName = $sheetNames[$i];
            if (! in_array($sheetName, $usedSheetNames)) {
                $sheet = $spreadsheet->getSheetByName($sheetName);
                if ($sheet) {
                    $spreadsheet->removeSheetByIndex($spreadsheet->getIndex($sheet));
                }
            }
        }

        $nomor = str_replace('/', '-', $this->pd->nomor_permohonan);
        $filename = "Nominatif_{$nomor}.xlsx";

        $tempFile = tempnam(sys_get_temp_dir(), 'nominatif_');
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

    private function processSheet(Worksheet $sheet, string $kodeAkun, $rows, string $namaItem): void
    {
        $cfg = self::CONFIG[$kodeAkun];
        $format = $cfg['format'];
        $isHonor = in_array($kodeAkun, self::HONOR_AKUN);
        $actualCount = $rows->count();
        $placeholderCount = $cfg['dataEndRow'] - $cfg['dataStartRow'] + 1;
        $offset = max(0, $actualCount - $placeholderCount);

        // Insert rows if data > placeholder
        if ($offset > 0) {
            $insertAfterRow = $cfg['dataEndRow'];
            $sheet->insertNewRowBefore($insertAfterRow + 1, $offset);
        }

        // Clear old data
        $this->clearDataDummy($sheet, $cfg, $actualCount);

        // Update header
        $this->updateHeader($sheet, $kodeAkun, $cfg, $namaItem, $isHonor);

        // Populate data
        $this->populateData($sheet, $kodeAkun, $cfg, $rows);

        // Update footer
        $totalDiterima = $this->calculateTotalDiterima($kodeAkun, $rows);
        $this->updateFooter($sheet, $kodeAkun, $cfg, $actualCount, $totalDiterima, $rows);

        $this->prepareSheetView($sheet, $cfg);
    }

    private function clearDataDummy(Worksheet $sheet, array $cfg, int $actualCount): void
    {
        $dataStartRow = $cfg['dataStartRow'];
        $lastCol = $cfg['lastCol'];

        // Clear all data rows (including inserted rows)
        $lastDataRow = $dataStartRow + $actualCount - 1;
        for ($row = $dataStartRow; $row <= $lastDataRow; $row++) {
            for ($col = 'A'; $col <= $lastCol; $col++) {
                $sheet->setCellValue($col.$row, '');
            }
        }
    }

    private function updateHeader(Worksheet $sheet, string $kodeAkun, array $cfg, string $namaItem, bool $isHonor): void
    {
        $this->clearHeader($sheet, $cfg);

        $noSk = $this->pd->no_sk ?? 'XXX/LL3/KP.04.01';
        $tglSk = $this->pd->tgl_sk ? $this->fmtTgl($this->pd->tgl_sk) : '-';
        $noSt = $this->pd->no_st ?? 'XXXXXXXXXXXXXX';
        $tglSt = $this->pd->tgl_st ? $this->fmtTgl($this->pd->tgl_st) : '-';
        $tahun = $this->pd->tanggal_mulai ? substr((string) $this->pd->tanggal_mulai, 0, 4) : now()->year;
        $kegiatan = strtoupper($this->pd->keperluan ?? '');
        $tempat = strtoupper($this->pd->tempat ?? 'JAKARTA');
        $tglPel = $this->getTglPelaksanaan();

        if ($kodeAkun === '521115') {
            $bulan = $this->pd->tanggal_mulai ? strtoupper($this->fmtBulanTahun($this->pd->tanggal_mulai)) : 'XXXX '.now()->year;
            $sheet->setCellValue('A5', 'DAFTAR PEMBAYARAN HONORARIUM OPERASIONAL SATUAN KERJA');
            $sheet->setCellValue('A6', "BULAN {$bulan}");
            $sheet->setCellValue('A7', "{$kodeAkun} ".($namaItem ?: 'Belanja Honor Operasional Satuan Kerja'));
            $sheet->setCellValue('A3', "Nomor : {$noSk} Tgl {$tglSk}");
        } else {
            $headerCol = $isHonor ? 'A' : 'B';
            $sheet->setCellValue("{$headerCol}3", $isHonor
                ? "Nomor : {$noSk} Tgl {$tglSk}"
                : "Nomor : {$noSt}  Tgl {$tglSt}");
            $sheet->setCellValue("{$headerCol}5", match ($kodeAkun) {
                '521213' => 'DAFTAR PEMBAYARAN HONORARIUM PANITIA',
                '522151' => 'DAFTAR PEMBAYARAN HONORARIUM NARASUMBER DAN MODERATOR',
                default => 'DAFTAR PEMBAYARAN TRANSPORT DAN UANG HARIAN PERJALANAN DINAS',
            });
            $sheet->setCellValue("{$headerCol}6", "KEGIATAN  {$kegiatan}");
            $sheet->setCellValue("{$headerCol}7", "DI LINGKUNGAN LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III JAKARTA TAHUN ANGGARAN {$tahun}");
            $sheet->setCellValue("{$headerCol}8", "DI {$tempat}  TANGGAL {$tglPel}");

            $namaAkun = match ($kodeAkun) {
                '521213' => 'Belanja Honor Output Kegiatan',
                '522151' => 'Belanja Jasa Profesi',
                '524111' => 'Belanja Perjalanan Dinas Biasa',
                '524113' => 'Belanja Perjalanan Dinas Dalam Kota',
                '524114' => 'Belanja Perjalanan Dinas Paket Meeting Dalam Kota',
                '524119' => 'Belanja Perjalanan Dinas Paket Meeting Luar Kota',
                default => '',
            };
            $sheet->setCellValue("{$headerCol}9", "{$kodeAkun} {$namaAkun}");
        }
    }

    private function populateData(Worksheet $sheet, string $kodeAkun, array $cfg, $rows): void
    {
        $dataStartRow = $cfg['dataStartRow'];
        $format = $cfg['format'];
        $no = 1;

        foreach ($rows as $nom) {
            $row = $dataStartRow + $no - 1;

            if ($format === 'A') {
                $this->setCellValue($sheet, "A{$row}", $no);
                $this->setCellValue($sheet, "B{$row}", $nom->nama);
                $this->setCellValue($sheet, "C{$row}", $nom->nik ?? '', true);
                $this->setCellValue($sheet, "D{$row}", $nom->npwp ?? '', true);
                $this->setCellValue($sheet, "E{$row}", $nom->gol_ruang ?? '');
                $this->setCellValue($sheet, "F{$row}", (float) $nom->volume);
                $this->setCellValue($sheet, "G{$row}", (float) $nom->harga_satuan);
                $this->setCellValue($sheet, "H{$row}", (float) $nom->jumlah_bruto);
                $this->setCellValue($sheet, "I{$row}", (float) $nom->jumlah_bruto);
                $this->setCellValue($sheet, "J{$row}", ((float) $nom->pph21_persen) / 100);
                $this->setCellValue($sheet, "K{$row}", (float) $nom->jumlah_pajak);
                $this->setCellValue($sheet, "L{$row}", (float) $nom->jumlah_diterima);
                $this->setCellValue($sheet, "M{$row}", $nom->nama_rekening);
                $this->setCellValue($sheet, "N{$row}", $nom->no_rekening ?? '', true);
                $this->setCellValue($sheet, "O{$row}", $nom->nama_bank);
                $this->setCellValue($sheet, "P{$row}", $nom->email);
            } elseif ($format === 'B') {
                $this->setCellValue($sheet, "A{$row}", $no);
                $this->setCellValue($sheet, "B{$row}", $nom->nama);
                $this->setCellValue($sheet, "C{$row}", $nom->jabatan ?? '');
                $this->setCellValue($sheet, "D{$row}", $nom->nik ?? '', true);
                $this->setCellValue($sheet, "E{$row}", $nom->npwp ?? '', true);
                $this->setCellValue($sheet, "F{$row}", $nom->gol_ruang ?? '');
                $this->setCellValue($sheet, "G{$row}", (float) $nom->volume);
                $this->setCellValue($sheet, "H{$row}", (float) $nom->harga_satuan);
                $this->setCellValue($sheet, "I{$row}", (float) $nom->jumlah_bruto);
                $this->setCellValue($sheet, "J{$row}", (float) $nom->jumlah_bruto);
                $this->setCellValue($sheet, "K{$row}", ((float) $nom->pph21_persen) / 100);
                $this->setCellValue($sheet, "L{$row}", (float) $nom->jumlah_pajak);
                $this->setCellValue($sheet, "M{$row}", (float) $nom->jumlah_diterima);
                $this->setCellValue($sheet, "N{$row}", $nom->nama_rekening);
                $this->setCellValue($sheet, "O{$row}", $nom->no_rekening ?? '', true);
                $this->setCellValue($sheet, "P{$row}", $nom->nama_bank);
                $this->setCellValue($sheet, "Q{$row}", $nom->email);
            } elseif ($format === 'C') {
                $this->setCellValue($sheet, "B{$row}", $no);
                $this->setCellValue($sheet, "C{$row}", $nom->nama);
                $this->setCellValue($sheet, "D{$row}", (float) $nom->transport);
                $this->setCellValue($sheet, "E{$row}", (float) $nom->uang_harian_vol);
                $this->setCellValue($sheet, "F{$row}", (float) $nom->uang_harian_satuan);
                $this->setCellValue($sheet, "G{$row}", (float) $nom->uang_harian_jumlah);
                $this->setCellValue($sheet, "H{$row}", (float) $nom->fullboard_vol);
                $this->setCellValue($sheet, "I{$row}", (float) $nom->fullboard_satuan);
                $this->setCellValue($sheet, "J{$row}", (float) $nom->fullboard_jumlah);
                $this->setCellValue($sheet, "K{$row}", (float) $nom->fullday_vol);
                $this->setCellValue($sheet, "L{$row}", (float) $nom->fullday_satuan);
                $this->setCellValue($sheet, "M{$row}", (float) $nom->fullday_jumlah);

                if (in_array($kodeAkun, self::PERJADIN_LUAR_AKUN)) {
                    $this->setCellValue($sheet, "N{$row}", (float) $nom->taksi_pp);
                    $this->setCellValue($sheet, "O{$row}", (float) $nom->tiket_pesawat);
                    $this->setCellValue($sheet, "P{$row}", (float) $nom->hotel);
                    $this->setCellValue($sheet, "Q{$row}", (float) $nom->jumlah_perjadin);
                    $this->setCellValue($sheet, "R{$row}", $nom->nama_rekening);
                    $this->setCellValue($sheet, "S{$row}", $nom->no_rekening ?? '', true);
                    $this->setCellValue($sheet, "T{$row}", $nom->nama_bank);
                    $this->setCellValue($sheet, "U{$row}", $nom->email);
                } else {
                    $this->setCellValue($sheet, "N{$row}", (float) $nom->hotel);
                    $this->setCellValue($sheet, "O{$row}", (float) $nom->jumlah_perjadin);
                    $this->setCellValue($sheet, "P{$row}", $nom->nama_rekening);
                    $this->setCellValue($sheet, "Q{$row}", $nom->no_rekening ?? '', true);
                    $this->setCellValue($sheet, "R{$row}", $nom->nama_bank);
                    $this->setCellValue($sheet, "S{$row}", $nom->email);
                }
            }

            $no++;
        }
    }

    private function updateFooter(Worksheet $sheet, string $kodeAkun, array $cfg, int $actualCount, float $totalDiterima, $rows): void
    {
        $placeholderCount = $cfg['dataEndRow'] - $cfg['dataStartRow'] + 1;
        $offset = max(0, $actualCount - $placeholderCount);

        $jumlahRow = $cfg['jumlahRow'] + $offset;
        $terbilangRow = $cfg['terbilangRow'] + $offset;
        $jakartaRow = $cfg['jakartaRow'] + $offset;
        $ppkNameRow = $cfg['ppkNameRow'] + $offset;
        $ppkNipRow = $cfg['ppkNipRow'] + $offset;
        $mengetahuiRow = $cfg['mengetahuiRow'] + $offset;
        $anKuasaRow = $cfg['anKuasaRow'] + $offset;
        $pejabatRow = $cfg['pejabatRow'] + $offset;

        $this->clearFooter($sheet, $cfg, $offset);

        $isHonor = in_array($kodeAkun, self::HONOR_AKUN);
        $colA = $isHonor ? 'A' : 'B';
        $jakartaCol = match ($kodeAkun) {
            '521115' => 'M',
            '521213', '522151' => 'N',
            '524111', '524119' => 'S',
            '524113', '524114' => 'Q',
            default => 'N',
        };

        // Jumlah
        $sheet->setCellValue("B{$jumlahRow}", 'Jumlah');
        $this->updateJumlahRow($sheet, $kodeAkun, $jumlahRow, $rows, $totalDiterima);

        // Terbilang
        $terbilangText = ucwords($this->terbilang((int) $totalDiterima)).' Rupiah';
        if ($kodeAkun === '521115') {
            $sheet->setCellValue("D{$terbilangRow}", "  {$terbilangText}");
        } elseif (in_array($kodeAkun, ['521213', '522151'])) {
            $sheet->setCellValue("D{$terbilangRow}", '"');
            $sheet->setCellValue("E{$terbilangRow}", $terbilangText);
        } else {
            $sheet->setCellValue("D{$terbilangRow}", "  {$terbilangText}");
        }

        // Jakarta date
        $sheet->setCellValue("{$jakartaCol}{$jakartaRow}", "Jakarta,    {$this->tglNominatif}");

        // Mengetahui / Menyetujui
        $sheet->setCellValue("{$colA}{$mengetahuiRow}", 'Mengetahui/Menyetujui');
        $sheet->setCellValue("{$jakartaCol}{$mengetahuiRow}", 'Lunas dibayar tanggal:');

        // an. Kuasa Pengguna Anggaran
        $sheet->setCellValue("{$colA}{$anKuasaRow}", 'an. Kuasa Pengguna Anggaran');
        $sheet->setCellValue("{$jakartaCol}{$anKuasaRow}", 'Bendahara Pengeluaran,');

        // Pejabat Pembuat Komitmen
        $sheet->setCellValue("{$colA}{$pejabatRow}", 'Pejabat Pembuat Komitmen');

        // PIC Keuangan — middle signature
        $picMidCol = $cfg['picMidCol'];
        $sheet->setCellValue("{$picMidCol}{$mengetahuiRow}", 'Pembuat daftar,');
        // PPK and Bendahara names
        $activePpk = User::where('role', 'pimpinan')
            ->where('pimpinan_type', 'ppk')
            ->where('is_active', true)
            ->first();
        $ppk = $activePpk ?: $this->ppk;

        $ppkNip = $ppk?->nip ?: $this->lookupNipFromRefNama($ppk?->nama_lengkap);
        $bendNip = $this->bendahara?->nip ?: $this->lookupNipFromRefNama($this->bendahara?->nama_lengkap);

        $sheet->setCellValue("{$colA}{$ppkNameRow}", $ppk?->nama_lengkap ?? '___________________________');
        $sheet->setCellValue("{$colA}{$ppkNipRow}", 'NIP. '.($ppkNip ?: '-'));

        $sheet->setCellValue("{$jakartaCol}{$ppkNameRow}", $this->bendahara?->nama_lengkap ?? '___________________________');
        $sheet->setCellValue("{$jakartaCol}{$ppkNipRow}", 'NIP. '.($bendNip ?: '-'));

        $picNip = $this->picKeuangan?->nip ?: $this->lookupNipFromRefNama($this->picKeuangan?->nama_lengkap);
        $sheet->setCellValue("{$picMidCol}{$ppkNameRow}", $this->picKeuangan?->nama_lengkap ?? '___________________________');
        $sheet->setCellValue("{$picMidCol}{$ppkNipRow}", 'NIP. '.($picNip ?: '-'));
        $sheet->getStyle("{$picMidCol}{$ppkNameRow}")->getFont()->setBold(true);
        $sheet->getStyle("{$picMidCol}{$ppkNipRow}")->getFont()->setBold(true);
    }

    private function updateJumlahRow(Worksheet $sheet, string $kodeAkun, int $row, $rows, float $totalDiterima): void
    {
        if ($kodeAkun === '521115') {
            $sheet->setCellValue("F{$row}", $rows->sum(fn ($n) => (float) $n->volume));
            $sheet->setCellValue("G{$row}", $rows->sum(fn ($n) => (float) $n->harga_satuan));
            $sheet->setCellValue("H{$row}", $rows->sum(fn ($n) => (float) $n->jumlah_bruto));
            $sheet->setCellValue("I{$row}", $rows->sum(fn ($n) => (float) $n->jumlah_bruto));
            $sheet->setCellValue("K{$row}", $rows->sum(fn ($n) => (float) $n->jumlah_pajak));
            $sheet->setCellValue("L{$row}", $totalDiterima);

            return;
        }

        if (in_array($kodeAkun, ['521213', '522151'])) {
            $sheet->setCellValue("G{$row}", $rows->sum(fn ($n) => (float) $n->volume));
            $sheet->setCellValue("H{$row}", $rows->sum(fn ($n) => (float) $n->harga_satuan));
            $sheet->setCellValue("I{$row}", $rows->sum(fn ($n) => (float) $n->jumlah_bruto));
            $sheet->setCellValue("J{$row}", $rows->sum(fn ($n) => (float) $n->jumlah_bruto));
            $sheet->setCellValue("L{$row}", $rows->sum(fn ($n) => (float) $n->jumlah_pajak));
            $sheet->setCellValue("M{$row}", $totalDiterima);

            return;
        }

        $sheet->setCellValue("D{$row}", $rows->sum(fn ($n) => (float) $n->transport));
        $sheet->setCellValue("E{$row}", $rows->sum(fn ($n) => (float) $n->uang_harian_vol));
        $sheet->setCellValue("F{$row}", $rows->sum(fn ($n) => (float) $n->uang_harian_satuan));
        $sheet->setCellValue("G{$row}", $rows->sum(fn ($n) => (float) $n->uang_harian_jumlah));
        $sheet->setCellValue("H{$row}", $rows->sum(fn ($n) => (float) $n->fullboard_vol));
        $sheet->setCellValue("I{$row}", $rows->sum(fn ($n) => (float) $n->fullboard_satuan));
        $sheet->setCellValue("J{$row}", $rows->sum(fn ($n) => (float) $n->fullboard_jumlah));
        $sheet->setCellValue("K{$row}", $rows->sum(fn ($n) => (float) $n->fullday_vol));
        $sheet->setCellValue("L{$row}", $rows->sum(fn ($n) => (float) $n->fullday_satuan));
        $sheet->setCellValue("M{$row}", $rows->sum(fn ($n) => (float) $n->fullday_jumlah));

        if (in_array($kodeAkun, self::PERJADIN_LUAR_AKUN)) {
            $sheet->setCellValue("N{$row}", $rows->sum(fn ($n) => (float) $n->taksi_pp));
            $sheet->setCellValue("O{$row}", $rows->sum(fn ($n) => (float) $n->tiket_pesawat));
            $sheet->setCellValue("P{$row}", $rows->sum(fn ($n) => (float) $n->hotel));
            $sheet->setCellValue("Q{$row}", $totalDiterima);
        } else {
            $sheet->setCellValue("N{$row}", $rows->sum(fn ($n) => (float) $n->hotel));
            $sheet->setCellValue("O{$row}", $totalDiterima);
        }
    }

    private function clearHeader(Worksheet $sheet, array $cfg): void
    {
        $endRow = $cfg['format'] === 'A' ? 7 : 9;
        for ($row = 3; $row <= $endRow; $row++) {
            for ($col = $cfg['headerStartCol']; $col <= $cfg['headerEndCol']; $col++) {
                $sheet->setCellValue("{$col}{$row}", '');
            }
        }
    }

    private function clearFooter(Worksheet $sheet, array $cfg, int $offset): void
    {
        $start = $cfg['terbilangRow'] + $offset + 1;
        $end = $cfg['ppkNipRow'] + $offset;
        for ($row = $start; $row <= $end; $row++) {
            for ($col = $cfg['footerStartCol']; $col <= $cfg['footerEndCol']; $col++) {
                $sheet->setCellValue("{$col}{$row}", '');
            }
        }
    }

    private function prepareSheetView(Worksheet $sheet, array $cfg): void
    {
        $lastCol = $cfg['lastCol'];
        $lastRow = $sheet->getHighestDataRow($lastCol);
        $sheet->getPageSetup()->setPrintArea("A1:{$lastCol}{$lastRow}");
        $sheet->setSelectedCell('A1');
    }

    private function setCellValue(Worksheet $sheet, string $cell, $value, bool $isText = false): void
    {
        if ($isText) {
            $sheet->setCellValueExplicit($cell, $value, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
        } else {
            $sheet->setCellValue($cell, $value);
        }
    }

    private function mergePerjadinPerOrang($rows)
    {
        $grouped = $rows->groupBy(fn ($n) => $n->ref_nama_id ? 'r'.$n->ref_nama_id : 'n'.strtolower(trim($n->nama)));

        return $grouped->map(function ($g) {
            if ($g->count() === 1) {
                return $g->first();
            }
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
        if (! $nama) {
            return null;
        }
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
        if (! $this->pd->tanggal_mulai || ! $this->pd->tanggal_selesai) {
            return '';
        }
        $m = strtoupper($this->fmtTgl($this->pd->tanggal_mulai));
        $s = strtoupper($this->fmtTgl($this->pd->tanggal_selesai));

        return $m === $s ? $m : "{$m} S.D. {$s}";
    }

    private function fmtTgl($date): string
    {
        $bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $d = is_string($date) ? new \DateTime($date) : $date;

        return $d->format('d').' '.$bulan[(int) $d->format('n')].' '.$d->format('Y');
    }

    private function fmtBulanTahun($date): string
    {
        $bulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        $d = is_string($date) ? new \DateTime($date) : $date;

        return $bulan[(int) $d->format('n')].' '.$d->format('Y');
    }

    private function terbilang(int $n): string
    {
        if ($n < 0) {
            return 'minus '.$this->terbilang(abs($n));
        }
        if ($n === 0) {
            return 'nol';
        }
        $s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
        if ($n < 20) {
            return $s[$n];
        }
        if ($n < 100) {
            return $s[(int) ($n / 10)].' puluh'.($n % 10 ? ' '.$s[$n % 10] : '');
        }
        if ($n < 200) {
            return 'seratus'.($n - 100 > 0 ? ' '.$this->terbilang($n - 100) : '');
        }
        if ($n < 1000) {
            return $s[(int) ($n / 100)].' ratus'.($n % 100 ? ' '.$this->terbilang($n % 100) : '');
        }
        if ($n < 2000) {
            return 'seribu'.($n - 1000 > 0 ? ' '.$this->terbilang($n - 1000) : '');
        }
        if ($n < 1_000_000) {
            return $this->terbilang((int) ($n / 1000)).' ribu'.($n % 1000 ? ' '.$this->terbilang($n % 1000) : '');
        }
        if ($n < 1_000_000_000) {
            return $this->terbilang((int) ($n / 1_000_000)).' juta'.($n % 1_000_000 ? ' '.$this->terbilang($n % 1_000_000) : '');
        }

        return $this->terbilang((int) ($n / 1_000_000_000)).' miliar'.($n % 1_000_000_000 ? ' '.$this->terbilang($n % 1_000_000_000) : '');
    }
}
