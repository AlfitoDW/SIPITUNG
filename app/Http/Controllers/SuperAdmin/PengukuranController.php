<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\LaporanPengukuran;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksiIndikator;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class PengukuranController extends Controller
{
    // ─── Kelola Periode (TW1–TW4) ───────────────────────────────────────────────

    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $periodes = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->orderByRaw("FIELD(triwulan, 'TW1','TW2','TW3','TW4')")
            ->get();

        return Inertia::render('SuperAdmin/Pengukuran/Index', [
            'tahun' => $tahun,
            'periodes' => $periodes,
        ]);
    }

    // ─── Laporan Reopen ──────────────────────────────────────────────────────────

    public function laporanReopen(LaporanPengukuran $laporan): RedirectResponse
    {
        abort_if(
            ! in_array($laporan->status, ['submitted', 'kabag_approved']),
            422,
            'Hanya laporan yang sedang diproses atau sudah disetujui yang dapat dibuka kembali.'
        );

        $laporan->update([
            'status' => 'draft',
            'rekomendasi_kabag' => null,
            'approved_at' => null,
            'approved_by' => null,
        ]);

        $nama = $laporan->timKerja?->nama_singkat ?? $laporan->timKerja?->nama ?? 'Tim Kerja';

        return back()->with('success', "Laporan {$nama} ({$laporan->periode?->triwulan}) berhasil dibuka kembali ke Draft.");
    }

    public function periodeStore(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();

        $data = $request->validate([
            'triwulan' => ['required', 'in:TW1,TW2,TW3,TW4'],
            'tanggal_mulai' => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
        ]);

        // Normalisasi datetime-local (YYYY-MM-DDTHH:MM) ke Y-m-d H:i:s
        // lalu konversi dari WIB (Asia/Jakarta) ke UTC sebelum disimpan.
        if (! empty($data['tanggal_selesai'])) {
            $raw = str_replace('T', ' ', (string) $data['tanggal_selesai']);
            if (! str_contains($raw, ':')) {
                $raw .= ' 00:00:00';
            } elseif (substr_count($raw, ':') === 1) {
                $raw .= ':00';
            }
            $data['tanggal_selesai'] = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $raw, 'Asia/Jakarta')
                ->setTimezone('UTC')
                ->format('Y-m-d H:i:s');
        }

        PeriodePengukuran::updateOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'triwulan' => $data['triwulan']],
            [
                'tanggal_mulai' => $data['tanggal_mulai'],
                'tanggal_selesai' => $data['tanggal_selesai'],
                'is_active' => false,
            ]
        );

        return back()->with('success', "Periode {$data['triwulan']} berhasil disimpan.");
    }

    public function periodeToggle(PeriodePengukuran $periode): RedirectResponse
    {
        $periode->update(['is_active' => ! $periode->is_active]);
        $label = $periode->is_active ? 'dibuka' : 'ditutup';

        return back()->with('success', "Periode {$periode->triwulan} berhasil {$label}.");
    }

    // ─── Realisasi (periode aktif, dengan selector) ──────────────────────────────

    public function realisasi(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();

        // Hanya tampilkan periode yang aktif di dropdown
        $periodes = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->where('is_active', true)
            ->orderByRaw("FIELD(triwulan, 'TW1','TW2','TW3','TW4')")
            ->get();

        $periodeId = $request->integer('periode_id');
        $periode = $periodeId
            ? $periodes->firstWhere('id', $periodeId)
            : $periodes->first();

        $matrix = [];

        if ($periode) {
            $twKey = strtolower($periode->triwulan);

            $pks = PerjanjianKinerja::with([
                'sasarans' => fn ($q) => $q->orderBy('kode'),
                'sasarans.indikators' => fn ($q) => $q->orderBy('kode'),
                'sasarans.indikators.picTimKerjas',
                'sasarans.indikators.realisasis' => fn ($q) => $q->with('inputByTimKerja')
                    ->where('periode_pengukuran_id', $periode->id),
            ])
                ->where('tahun_anggaran_id', $tahun->id)
                ->where('jenis', 'awal')
                ->orderBy('id')
                ->get();

            // Build lookup: target TW dari Rencana Aksi (user-editable), key = "{sasaran_id}_{kode}"
            $allSasaranIds = $pks->flatMap(fn ($pk) => $pk->sasarans->pluck('id'))->unique()->values()->all();
            $raIndMap = RencanaAksiIndikator::whereIn('sasaran_id', $allSasaranIds)
                ->get()
                ->keyBy(fn ($i) => $i->sasaran_id.'_'.$i->kode);

            foreach ($pks as $pk) {
                foreach ($pk->sasarans as $sasaran) {
                    foreach ($sasaran->indikators as $iku) {
                        $r = $iku->realisasis->first();
                        $raInd = $raIndMap->get($iku->sasaran_id.'_'.$iku->kode);
                        $targetTw = $raInd?->{"target_{$twKey}"} ?? $iku->{"target_{$twKey}"};
                        $matrix[] = [
                            'sasaran_kode' => $sasaran->kode,
                            'sasaran_nama' => $sasaran->nama,
                            'iku_id' => $iku->id,
                            'iku_kode' => $iku->kode,
                            'iku_nama' => $iku->nama,
                            'iku_satuan' => $iku->satuan,
                            'iku_target' => $iku->target,
                            'iku_target_tw' => $targetTw,
                            // Semua PIC (primary + co-PIC)
                            'pic_tim_kerjas' => $iku->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama', 'kode'])),
                            'realisasi' => $r?->realisasi,
                            'progress_kegiatan' => $r?->progress_kegiatan,
                            'kendala' => $r?->kendala,
                            'strategi_tindak_lanjut' => $r?->strategi_tindak_lanjut,
                            'catatan' => $r?->catatan,
                            // Tim yang mengisi duluan
                            'input_by_tim_kerja' => $r?->inputByTimKerja?->only(['id', 'nama', 'kode']),
                        ];
                    }
                }
            }
        }

        // Daftar laporan non-draft untuk panel status
        $laporans = LaporanPengukuran::with(['timKerja:id,nama,kode,nama_singkat', 'periode:id,triwulan'])
            ->whereHas('periode', fn ($q) => $q->where('tahun_anggaran_id', $tahun->id))
            ->whereIn('status', ['submitted', 'kabag_approved', 'rejected'])
            ->orderByRaw("FIELD(status,'submitted','rejected','kabag_approved')")
            ->orderBy('periode_pengukuran_id')
            ->orderBy('tim_kerja_id')
            ->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'status' => $l->status,
                'rekomendasi_kabag' => $l->rekomendasi_kabag,
                'submitted_at' => $l->submitted_at?->format('d M Y H:i'),
                'approved_at' => $l->approved_at?->format('d M Y H:i'),
                'periode_triwulan' => $l->periode?->triwulan ?? '',
                'tim_kerja' => $l->timKerja ? [
                    'id' => $l->timKerja->id,
                    'nama' => $l->timKerja->nama,
                    'kode' => $l->timKerja->kode,
                    'nama_singkat' => $l->timKerja->nama_singkat,
                ] : null,
            ])
            ->values()
            ->all();

        return Inertia::render('SuperAdmin/Pengukuran/Realisasi', [
            'tahun' => $tahun,
            'periodes' => $periodes,
            'periode' => $periode,
            'matrix' => $matrix,
            'laporans' => $laporans,
        ]);
    }

    // ─── Export XLSX ─────────────────────────────────────────────────────────────

    public function exportXls(Request $request)
    {
        $tahun = TahunAnggaran::forSession();

        $allPeriodes = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->orderByRaw("FIELD(triwulan, 'TW1','TW2','TW3','TW4')")
            ->get()
            ->keyBy('triwulan');

        $periodeIds = $allPeriodes->pluck('id')->all();

        $pks = PerjanjianKinerja::with([
            'sasarans' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators.picTimKerjas',
            'sasarans.indikators.realisasis' => fn ($q) => $q->with('inputByTimKerja')
                ->whereIn('periode_pengukuran_id', $periodeIds),
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        // Build lookup: target TW dari Rencana Aksi (user-editable), key = "{sasaran_id}_{kode}"
        $xlsSasaranIds = $pks->flatMap(fn ($pk) => $pk->sasarans->pluck('id'))->unique()->values()->all();
        $xlsRaIndMap = RencanaAksiIndikator::whereIn('sasaran_id', $xlsSasaranIds)
            ->get()
            ->keyBy(fn ($i) => $i->sasaran_id.'_'.$i->kode);

        // ── Flatten rows ───────────────────────────────────────────────────────
        $dataRows = [];
        foreach ($pks as $pk) {
            foreach ($pk->sasarans as $sasaran) {
                foreach ($sasaran->indikators as $iku) {
                    $realisasiByPeriode = $iku->realisasis->keyBy('periode_pengukuran_id');
                    $picNamas = $iku->picTimKerjas->pluck('nama')->implode(', ');
                    $anyR = $iku->realisasis->first();
                    $xlsRaInd = $xlsRaIndMap->get($iku->sasaran_id.'_'.$iku->kode);

                    $twData = [];
                    foreach (['TW1', 'TW2', 'TW3', 'TW4'] as $tw) {
                        $p = $allPeriodes->get($tw);
                        $r = $p ? $realisasiByPeriode->get($p->id) : null;
                        $twKey2 = strtolower($tw);
                        $twData[$tw] = [
                            'target' => $xlsRaInd?->{"target_{$twKey2}"} ?? $iku->{'target_'.$twKey2},
                            'realisasi' => $r?->realisasi,
                        ];
                    }

                    $dataRows[] = [
                        'sasaran_kode' => $sasaran->kode,
                        'sasaran_nama' => $sasaran->nama,
                        'iku_kode' => $iku->kode,
                        'iku_nama' => $iku->nama,
                        'iku_satuan' => $iku->satuan,
                        'iku_target' => $iku->target,
                        'pic_namas' => $picNamas ?: '-',
                        'diisi_oleh' => $anyR?->inputByTimKerja?->nama ?? '-',
                        'tw' => $twData,
                    ];
                }
            }
        }

        // ── Build spreadsheet ──────────────────────────────────────────────────
        $spreadsheet = new Spreadsheet;
        $spreadsheet->getDefaultStyle()->getFont()->setName('Times New Roman')->setSize(12);
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Realisasi Kinerja');

        // ── Title row ─────────────────────────────────────────────────────────
        $sheet->mergeCells('A1:Q1');
        $sheet->setCellValue('A1', "Realisasi Kinerja — {$tahun->label}");
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 13, 'name' => 'Times New Roman', 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '003580']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);

        // ── Header row 1 (merged TW groups) ───────────────────────────────────
        // Columns: A=No B=Sasaran C=IKU Kode D=Indikator E=Satuan F=Target PK G=PIC H=Diisi Oleh
        //          I-J=TW1 K-L=TW2 M-N=TW3 O-P=TW4 Q=Status
        $headerStyle = [
            'font' => ['bold' => true, 'name' => 'Times New Roman', 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '003580']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];
        $subHeaderStyle = [
            'font' => ['bold' => false, 'name' => 'Times New Roman', 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '004099']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];

        // Row 2: static headers (rowspan via merge 2-3) + TW group headers
        $staticHeaders = ['No', 'Sasaran', 'Kode IKU', 'Indikator Kinerja', 'Satuan', 'Target PK', 'PIC Tim Kerja', 'Diisi Oleh'];
        $staticCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        foreach ($staticHeaders as $i => $label) {
            $col = $staticCols[$i];
            $sheet->mergeCells("{$col}2:{$col}3");
            $sheet->setCellValue("{$col}2", $label);
            $sheet->getStyle("{$col}2:{$col}3")->applyFromArray($headerStyle);
        }

        // TW group headers (merged 2 cols each)
        $twCols = ['I' => 'TW1', 'K' => 'TW2', 'M' => 'TW3', 'O' => 'TW4'];
        $twColPairs = [
            'TW1' => ['I', 'J'],
            'TW2' => ['K', 'L'],
            'TW3' => ['M', 'N'],
            'TW4' => ['O', 'P'],
        ];
        $twLabels = ['TW1' => 'Triwulan I', 'TW2' => 'Triwulan II', 'TW3' => 'Triwulan III', 'TW4' => 'Triwulan IV'];
        foreach ($twCols as $startCol => $tw) {
            [$c1, $c2] = $twColPairs[$tw];
            $sheet->mergeCells("{$c1}2:{$c2}2");
            $sheet->setCellValue("{$c1}2", $twLabels[$tw]);
            $sheet->getStyle("{$c1}2:{$c2}2")->applyFromArray($headerStyle);
            // Sub-headers
            $sheet->setCellValue("{$c1}3", 'Target');
            $sheet->setCellValue("{$c2}3", 'Realisasi');
            $sheet->getStyle("{$c1}3:{$c2}3")->applyFromArray($subHeaderStyle);
        }

        // Status column
        $sheet->mergeCells('Q2:Q3');
        $sheet->setCellValue('Q2', 'Status');
        $sheet->getStyle('Q2:Q3')->applyFromArray($headerStyle);

        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getRowDimension(3)->setRowHeight(18);

        // ── Column widths ──────────────────────────────────────────────────────
        $colWidths = [
            'A' => 5,  'B' => 35, 'C' => 10, 'D' => 50, 'E' => 10,
            'F' => 10, 'G' => 35, 'H' => 25,
            'I' => 10, 'J' => 12, 'K' => 10, 'L' => 12,
            'M' => 10, 'N' => 12, 'O' => 10, 'P' => 12,
            'Q' => 11,
        ];
        foreach ($colWidths as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        // ── Data rows ──────────────────────────────────────────────────────────
        $startRow = 4;
        $currentRow = $startRow;
        $no = 1;
        $prevSasaranKode = null;
        $sasaranStartRow = $startRow;

        // Group rows by sasaran for merge
        $sasaranGroups = [];
        foreach ($dataRows as $dr) {
            $sasaranGroups[$dr['sasaran_kode']][] = $dr;
        }

        $dataCellStyle = [
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true, 'indent' => 1],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];
        $centerCellStyle = [
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];

        foreach ($sasaranGroups as $sasaranKode => $rows) {
            $groupStartRow = $currentRow;
            $groupSize = count($rows);

            foreach ($rows as $dr) {
                $sheet->getRowDimension($currentRow)->setRowHeight(-1); // auto-fit height

                // No
                $sheet->setCellValue("A{$currentRow}", $no++);
                $sheet->getStyle("A{$currentRow}")->applyFromArray($centerCellStyle);

                // Sasaran (filled on first row of group, merged later)
                if ($currentRow === $groupStartRow) {
                    $sheet->setCellValue("B{$currentRow}", "{$dr['sasaran_kode']} — {$dr['sasaran_nama']}");
                }

                // IKU Kode
                $sheet->setCellValue("C{$currentRow}", $dr['iku_kode']);
                $sheet->getStyle("C{$currentRow}")->applyFromArray($centerCellStyle);

                // Indikator nama
                $sheet->setCellValue("D{$currentRow}", $dr['iku_nama']);
                $sheet->getStyle("D{$currentRow}")->applyFromArray($dataCellStyle);

                // Satuan
                $sheet->setCellValue("E{$currentRow}", $dr['iku_satuan']);
                $sheet->getStyle("E{$currentRow}")->applyFromArray($centerCellStyle);

                // Target PK
                $sheet->setCellValue("F{$currentRow}", $dr['iku_target']);
                $sheet->getStyle("F{$currentRow}")->applyFromArray($centerCellStyle);

                // PIC
                $sheet->setCellValue("G{$currentRow}", $dr['pic_namas']);
                $sheet->getStyle("G{$currentRow}")->applyFromArray($dataCellStyle);

                // Diisi Oleh
                $sheet->setCellValue("H{$currentRow}", $dr['diisi_oleh']);
                $sheet->getStyle("H{$currentRow}")->applyFromArray($centerCellStyle);

                // TW columns
                foreach ($twColPairs as $tw => [$targetCol, $realisasiCol]) {
                    $twInfo = $dr['tw'][$tw];
                    $targetV = $twInfo['target'] ?? '-';
                    $realV = $twInfo['realisasi'] ?? '-';

                    $sheet->setCellValue("{$targetCol}{$currentRow}", $targetV);
                    $sheet->getStyle("{$targetCol}{$currentRow}")->applyFromArray($centerCellStyle);

                    $sheet->setCellValue("{$realisasiCol}{$currentRow}", $realV);
                    $sheet->getStyle("{$realisasiCol}{$currentRow}")->applyFromArray($centerCellStyle);
                }

                // Status
                $hasAnyReal = collect($dr['tw'])->contains(fn ($t) => $t['realisasi'] !== null && $t['realisasi'] !== '');
                $sheet->setCellValue("Q{$currentRow}", $hasAnyReal ? 'Ada Isian' : 'Kosong');
                $sheet->getStyle("Q{$currentRow}")->applyFromArray($centerCellStyle);

                $currentRow++;
            }

            // Merge Sasaran column for group
            if ($groupSize > 1) {
                $endRow = $groupStartRow + $groupSize - 1;
                $sheet->mergeCells("B{$groupStartRow}:B{$endRow}");
            }

            // Style Sasaran merged cell
            $sheet->getStyle("B{$groupStartRow}:B".($groupStartRow + $groupSize - 1))->applyFromArray([
                'font' => ['bold' => true, 'size' => 12, 'name' => 'Times New Roman'],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true, 'indent' => 1],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
            ]);
        }

        // ── Freeze panes ──────────────────────────────────────────────────────
        $sheet->freezePane('D4');

        // ── Sheet 2–5: Rencana Kegiatan per Triwulan ──────────────────────────────
        // Ambil SEMUA PK Awal (satu per tim kerja) agar tidak ada IKU yang terlewat
        $allPkAwals = PerjanjianKinerja::with([
            'sasarans' => fn ($q) => $q->orderBy('urutan'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('urutan'),
            'sasarans.indikators.picTimKerjas',
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        // Index semua RAI (dengan kegiatan) by kode IKU
        $raiByKode = \App\Models\RencanaAksiIndikator::with([
            'kegiatans' => fn ($q) => $q->orderBy('triwulan')->orderBy('urutan'),
        ])
            ->whereHas('rencanaAksi', fn ($q) => $q->where('tahun_anggaran_id', $tahun->id))
            ->get()
            ->keyBy('kode');

        // Merge sasaran & IKU dari semua PK Awal (dedup by kode)
        // Semua IKU selalu disertakan — kolom kegiatan kosong jika belum diisi
        $sasaranMap = [];
        foreach ($allPkAwals as $pkAwal) {
            foreach ($pkAwal->sasarans as $sasaran) {
                if (! isset($sasaranMap[$sasaran->kode])) {
                    $sasaranMap[$sasaran->kode] = [
                        'kode' => $sasaran->kode,
                        'nama' => $sasaran->nama,
                        'indikators' => [],
                    ];
                }
                foreach ($sasaran->indikators as $iku) {
                    if (isset($sasaranMap[$sasaran->kode]['indikators'][$iku->kode])) {
                        continue; // sudah ada dari PK lain
                    }
                    $rai = $raiByKode->get($iku->kode);

                    $picNames = $iku->picTimKerjas
                        ->map(fn ($t) => $t->nama_singkat ?? $t->kode)
                        ->join(' / ');

                    $twKegiatan = [];
                    for ($tw = 1; $tw <= 4; $tw++) {
                        $twKegiatan[$tw] = $rai
                            ? $rai->kegiatans->where('triwulan', $tw)->values()
                            : collect();
                    }

                    $sasaranMap[$sasaran->kode]['indikators'][$iku->kode] = [
                        'iku_kode' => $iku->kode,
                        'iku_nama' => $iku->nama,
                        'pic_names' => $picNames ?: '-',
                        'tw_kegiatan' => $twKegiatan,
                    ];
                }
            }
        }
        // Sort sasaran by kode (natural sort agar "1.10" tidak mendahului "1.2")
        uksort($sasaranMap, 'strnatcmp');

        // Sort indikator dalam tiap sasaran by kode (natural sort)
        foreach ($sasaranMap as &$s) {
            uksort($s['indikators'], 'strnatcmp');
        }
        unset($s);

        // Flatten ke $allKgRows
        $allKgRows = [];
        foreach ($sasaranMap as $sasaran) {
            foreach ($sasaran['indikators'] as $iku) {
                $allKgRows[] = [
                    'sasaran_kode' => $sasaran['kode'],
                    'sasaran_nama' => $sasaran['nama'],
                    'iku_kode' => $iku['iku_kode'],
                    'iku_nama' => $iku['iku_nama'],
                    'pic_names' => $iku['pic_names'],
                    'tw_kegiatan' => $iku['tw_kegiatan'],
                ];
            }
        }

        // Shared styles untuk sheet TW — selaras dengan sheet Realisasi Kinerja
        $kgWrapStyle = [
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true, 'indent' => 1],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];
        $kgCenterStyle = [
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];
        $kgSasaranHeaderStyle = [
            'font' => ['bold' => true, 'name' => 'Times New Roman', 'size' => 11, 'color' => ['rgb' => '1F3864']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D9E1F2']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'indent' => 1],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];

        $twSheetNames = [1 => 'Kegiatan TW I', 2 => 'Kegiatan TW II', 3 => 'Kegiatan TW III', 4 => 'Kegiatan TW IV'];
        $twSheetTitles = [
            1 => 'Rencana Kegiatan Triwulan I',
            2 => 'Rencana Kegiatan Triwulan II',
            3 => 'Rencana Kegiatan Triwulan III',
            4 => 'Rencana Kegiatan Triwulan IV',
        ];

        foreach ([1, 2, 3, 4] as $tw) {
            // Semua IKU ditampilkan — termasuk yang belum punya kegiatan di TW ini
            $twRows = $allKgRows;
            if (empty($twRows)) {
                continue;
            }

            $shTw = $spreadsheet->createSheet();
            $shTw->setTitle($twSheetNames[$tw]);

            // ── Title ────────────────────────────────────────────────────────
            $shTw->mergeCells('A1:E1');
            $shTw->setCellValue('A1', $twSheetTitles[$tw]." — {$tahun->label}");
            $shTw->getStyle('A1:E1')->applyFromArray([
                'font' => ['bold' => true, 'size' => 13, 'name' => 'Times New Roman', 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '003580']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
            ]);
            $shTw->getRowDimension(1)->setRowHeight(30);

            // ── Header ───────────────────────────────────────────────────────
            // Kolom: No | Kode IKU | Indikator Kinerja | Tim Kerja PIC | Rencana Kegiatan
            // (Sasaran ditampilkan sebagai baris pemisah grup, bukan kolom)
            $twHeaders = ['A' => 'No', 'B' => 'Kode IKU', 'C' => 'Indikator Kinerja Utama', 'D' => 'Tim Kerja PIC', 'E' => 'Rencana Kegiatan'];
            foreach ($twHeaders as $col => $label) {
                $shTw->setCellValue("{$col}2", $label);
                $shTw->getStyle("{$col}2")->applyFromArray($headerStyle);
            }
            $shTw->getRowDimension(2)->setRowHeight(22);

            // ── Column widths ─────────────────────────────────────────────────
            foreach (['A' => 5, 'B' => 12, 'C' => 52, 'D' => 26, 'E' => 68] as $col => $w) {
                $shTw->getColumnDimension($col)->setWidth($w);
            }

            // ── Data rows ─────────────────────────────────────────────────────
            $rowTw = 3;
            $noTw = 1;
            $prevSasaranTw = null;

            foreach ($twRows as $dr) {
                // ── Sasaran section-header row (saat sasaran berganti) ─────────
                if ($dr['sasaran_kode'] !== $prevSasaranTw) {
                    $shTw->mergeCells("A{$rowTw}:E{$rowTw}");
                    $shTw->setCellValue("A{$rowTw}", $dr['sasaran_kode'].'   —   '.$dr['sasaran_nama']);
                    $shTw->getStyle("A{$rowTw}:E{$rowTw}")->applyFromArray($kgSasaranHeaderStyle);
                    $shTw->getRowDimension($rowTw)->setRowHeight(18);
                    $rowTw++;
                    $prevSasaranTw = $dr['sasaran_kode'];
                }

                // ── IKU data row ───────────────────────────────────────────────
                $items = $dr['tw_kegiatan'][$tw];
                $kegiatanStr = $items->isNotEmpty()
                    ? $items->map(fn ($k, $i) => ($i + 1).'. '.$k->nama_kegiatan)->join("\n")
                    : '-';

                $shTw->setCellValue("A{$rowTw}", $noTw++);
                $shTw->setCellValue("B{$rowTw}", $dr['iku_kode']);
                $shTw->setCellValue("C{$rowTw}", $dr['iku_nama']);
                $shTw->setCellValue("D{$rowTw}", $dr['pic_names']);
                $shTw->setCellValue("E{$rowTw}", $kegiatanStr);

                $shTw->getStyle("A{$rowTw}")->applyFromArray($kgCenterStyle);
                $shTw->getStyle("B{$rowTw}")->applyFromArray($kgCenterStyle);
                $shTw->getStyle("C{$rowTw}")->applyFromArray($kgWrapStyle);
                $shTw->getStyle("D{$rowTw}")->applyFromArray($kgCenterStyle);
                $shTw->getStyle("E{$rowTw}")->applyFromArray($kgWrapStyle);
                $shTw->getRowDimension($rowTw)->setRowHeight(-1); // auto-height (berhasil untuk non-merged)

                $rowTw++;
            }

            $shTw->freezePane('A3');
        }

        // Reset ke sheet pertama (Realisasi Kinerja)
        $spreadsheet->setActiveSheetIndex(0);

        // ── Output ────────────────────────────────────────────────────────────
        $filename = "Realisasi_Kinerja_{$tahun->tahun}.xlsx";

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'max-age=0',
        ]);
    }

    // ─── Export PDF ──────────────────────────────────────────────────────────────

    public function exportPdf(Request $request)
    {
        $tahun = TahunAnggaran::forSession();

        $allPeriodes = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->orderByRaw("FIELD(triwulan, 'TW1','TW2','TW3','TW4')")
            ->get()
            ->keyBy('triwulan');

        $periodeIds = $allPeriodes->pluck('id')->all();

        $pks = PerjanjianKinerja::with([
            'sasarans' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators.picTimKerjas',
            'sasarans.indikators.realisasis' => fn ($q) => $q->with('inputByTimKerja')
                ->whereIn('periode_pengukuran_id', $periodeIds),
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        // Build lookup: target TW dari Rencana Aksi (user-editable), key = "{sasaran_id}_{kode}"
        $pdfSasaranIds = $pks->flatMap(fn ($pk) => $pk->sasarans->pluck('id'))->unique()->values()->all();
        $pdfRaIndMap = RencanaAksiIndikator::whereIn('sasaran_id', $pdfSasaranIds)
            ->get()
            ->keyBy(fn ($i) => $i->sasaran_id.'_'.$i->kode);

        $matrix = [];

        foreach ($pks as $pk) {
            foreach ($pk->sasarans as $sasaran) {
                foreach ($sasaran->indikators as $iku) {
                    $realisasiByPeriode = $iku->realisasis->keyBy('periode_pengukuran_id');
                    $pdfRaInd = $pdfRaIndMap->get($iku->sasaran_id.'_'.$iku->kode);

                    $tw = [];
                    foreach (['TW1', 'TW2', 'TW3', 'TW4'] as $twKey) {
                        $p = $allPeriodes->get($twKey);
                        $r = $p ? $realisasiByPeriode->get($p->id) : null;
                        $twLow = strtolower($twKey);
                        $tw[] = [
                            'tw' => $twKey,
                            'target' => $pdfRaInd?->{"target_{$twLow}"} ?? $iku->{'target_'.$twLow},
                            'realisasi' => $r?->realisasi,
                        ];
                    }

                    $anyR = $iku->realisasis->first();
                    $matrix[] = [
                        'sasaran_kode' => $sasaran->kode,
                        'sasaran_nama' => $sasaran->nama,
                        'iku_kode' => $iku->kode,
                        'iku_nama' => $iku->nama,
                        'iku_satuan' => $iku->satuan,
                        'iku_target' => $iku->target,
                        'pic_tim_kerjas' => $iku->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama'])),
                        'input_by_tim_kerja' => $anyR?->inputByTimKerja?->only(['id', 'nama']),
                        'tw' => $tw,
                    ];
                }
            }
        }

        return Inertia::render('SuperAdmin/Pengukuran/ExportPdf', [
            'tahun' => $tahun,
            'matrix' => $matrix,
        ]);
    }

    // ─── Export PDF per Triwulan ──────────────────────────────────────────────────

    public function exportTwPdf(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();

        $periodes = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
            ->orderByRaw("FIELD(triwulan, 'TW1','TW2','TW3','TW4')")
            ->get();

        $periodeId = $request->integer('periode_id');
        $periode = $periodeId
            ? $periodes->firstWhere('id', $periodeId)
            : $periodes->first();

        abort_if(! $periode, 404, 'Periode tidak ditemukan.');

        $twKey = strtolower($periode->triwulan);

        $pks = PerjanjianKinerja::with([
            'sasarans' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators.picTimKerjas',
            'sasarans.indikators.realisasis' => fn ($q) => $q->with('inputByTimKerja')
                ->where('periode_pengukuran_id', $periode->id),
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->orderBy('id')
            ->get();

        $allSasaranIds2 = $pks->flatMap(fn ($pk) => $pk->sasarans->pluck('id'))->unique()->values()->all();
        $raIndMap2 = RencanaAksiIndikator::whereIn('sasaran_id', $allSasaranIds2)
            ->get()
            ->keyBy(fn ($i) => $i->sasaran_id.'_'.$i->kode);

        $matrix = [];
        foreach ($pks as $pk) {
            foreach ($pk->sasarans as $sasaran) {
                foreach ($sasaran->indikators as $iku) {
                    $r = $iku->realisasis->first();
                    $raInd2 = $raIndMap2->get($iku->sasaran_id.'_'.$iku->kode);
                    $matrix[] = [
                        'sasaran_kode' => $sasaran->kode,
                        'sasaran_nama' => $sasaran->nama,
                        'iku_kode' => $iku->kode,
                        'iku_nama' => $iku->nama,
                        'iku_satuan' => $iku->satuan,
                        'iku_target' => $iku->target,
                        'iku_target_tw' => $raInd2?->{"target_{$twKey}"} ?? $iku->{"target_{$twKey}"},
                        'pic_tim_kerjas' => $iku->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama'])),
                        'realisasi' => $r?->realisasi,
                        'progress_kegiatan' => $r?->progress_kegiatan,
                        'kendala' => $r?->kendala,
                        'strategi_tindak_lanjut' => $r?->strategi_tindak_lanjut,
                        'input_by_tim_kerja' => $r?->inputByTimKerja?->only(['id', 'nama']),
                    ];
                }
            }
        }

        $laporans = LaporanPengukuran::with('timKerja:id,nama,kode')
            ->where('periode_pengukuran_id', $periode->id)
            ->get()
            ->map(fn ($l) => [
                'tim_kerja_nama' => $l->timKerja?->nama ?? '',
                'status' => $l->status,
                'rekomendasi_kabag' => $l->rekomendasi_kabag,
                'approved_at' => $l->approved_at?->format('d M Y'),
            ]);

        return Inertia::render('Pimpinan/Pengukuran/ExportPdf', [
            'tahun' => $tahun,
            'periode' => $periode,
            'matrix' => $matrix,
            'laporans' => $laporans,
        ]);
    }
}
