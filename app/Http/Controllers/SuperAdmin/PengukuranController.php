<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

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
            'tahun'    => $tahun,
            'periodes' => $periodes,
        ]);
    }

    public function periodeStore(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();

        $data = $request->validate([
            'triwulan'        => ['required', 'in:TW1,TW2,TW3,TW4'],
            'tanggal_mulai'   => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:tanggal_mulai'],
        ]);

        PeriodePengukuran::updateOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'triwulan' => $data['triwulan']],
            [
                'tanggal_mulai'   => $data['tanggal_mulai'],
                'tanggal_selesai' => $data['tanggal_selesai'],
                'is_active'       => false,
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
        $periode   = $periodeId
            ? $periodes->firstWhere('id', $periodeId)
            : $periodes->first();

        $matrix = [];

        if ($periode) {
            $twKey = strtolower($periode->triwulan);

            $pks = PerjanjianKinerja::with([
                'sasarans'                         => fn ($q) => $q->orderBy('kode'),
                'sasarans.indikators'              => fn ($q) => $q->orderBy('kode'),
                'sasarans.indikators.picTimKerjas',
                'sasarans.indikators.realisasis'   => fn ($q) => $q->with('inputByTimKerja')
                    ->where('periode_pengukuran_id', $periode->id),
            ])
                ->where('tahun_anggaran_id', $tahun->id)
                ->where('jenis', 'awal')
                ->orderBy('id')
                ->get();

            foreach ($pks as $pk) {
                foreach ($pk->sasarans as $sasaran) {
                    foreach ($sasaran->indikators as $iku) {
                        $r        = $iku->realisasis->first();
                        $matrix[] = [
                            'sasaran_kode'           => $sasaran->kode,
                            'sasaran_nama'           => $sasaran->nama,
                            'iku_id'                 => $iku->id,
                            'iku_kode'               => $iku->kode,
                            'iku_nama'               => $iku->nama,
                            'iku_satuan'             => $iku->satuan,
                            'iku_target'             => $iku->target,
                            'iku_target_tw'          => $iku->{"target_{$twKey}"},
                            // Semua PIC (primary + co-PIC)
                            'pic_tim_kerjas'         => $iku->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama', 'kode'])),
                            'realisasi'              => $r?->realisasi,
                            'progress_kegiatan'      => $r?->progress_kegiatan,
                            'kendala'                => $r?->kendala,
                            'strategi_tindak_lanjut' => $r?->strategi_tindak_lanjut,
                            'catatan'                => $r?->catatan,
                            // Tim yang mengisi duluan
                            'input_by_tim_kerja'     => $r?->inputByTimKerja?->only(['id', 'nama', 'kode']),
                        ];
                    }
                }
            }
        }

        return Inertia::render('SuperAdmin/Pengukuran/Realisasi', [
            'tahun'    => $tahun,
            'periodes' => $periodes,
            'periode'  => $periode,
            'matrix'   => $matrix,
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
            'sasarans'                       => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators'            => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators.picTimKerjas',
            'sasarans.indikators.realisasis' => fn ($q) => $q->with('inputByTimKerja')
                ->whereIn('periode_pengukuran_id', $periodeIds),
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        // ── Flatten rows ───────────────────────────────────────────────────────
        $dataRows = [];
        foreach ($pks as $pk) {
            foreach ($pk->sasarans as $sasaran) {
                foreach ($sasaran->indikators as $iku) {
                    $realisasiByPeriode = $iku->realisasis->keyBy('periode_pengukuran_id');
                    $picNamas           = $iku->picTimKerjas->pluck('nama')->implode(', ');
                    $anyR               = $iku->realisasis->first();

                    $twData = [];
                    foreach (['TW1', 'TW2', 'TW3', 'TW4'] as $tw) {
                        $p           = $allPeriodes->get($tw);
                        $r           = $p ? $realisasiByPeriode->get($p->id) : null;
                        $twData[$tw] = [
                            'target'    => $iku->{'target_' . strtolower($tw)},
                            'realisasi' => $r?->realisasi,
                        ];
                    }

                    $dataRows[] = [
                        'sasaran_kode' => $sasaran->kode,
                        'sasaran_nama' => $sasaran->nama,
                        'iku_kode'     => $iku->kode,
                        'iku_nama'     => $iku->nama,
                        'iku_satuan'   => $iku->satuan,
                        'iku_target'   => $iku->target,
                        'pic_namas'    => $picNamas ?: '-',
                        'diisi_oleh'   => $anyR?->inputByTimKerja?->nama ?? '-',
                        'tw'           => $twData,
                    ];
                }
            }
        }

        // ── Build spreadsheet ──────────────────────────────────────────────────
        $spreadsheet = new Spreadsheet();
        $spreadsheet->getDefaultStyle()->getFont()->setName('Times New Roman')->setSize(12);
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Realisasi Kinerja');

        // ── Title row ─────────────────────────────────────────────────────────
        $sheet->mergeCells('A1:Q1');
        $sheet->setCellValue('A1', "Realisasi Kinerja — {$tahun->label}");
        $sheet->getStyle('A1')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 13, 'name' => 'Times New Roman', 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '003580']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);

        // ── Header row 1 (merged TW groups) ───────────────────────────────────
        // Columns: A=No B=Sasaran C=IKU Kode D=Indikator E=Satuan F=Target PK G=PIC H=Diisi Oleh
        //          I-J=TW1 K-L=TW2 M-N=TW3 O-P=TW4 Q=Status
        $headerStyle = [
            'font'      => ['bold' => true, 'name' => 'Times New Roman', 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '003580']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];
        $subHeaderStyle = [
            'font'      => ['bold' => false, 'name' => 'Times New Roman', 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '004099']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];

        // Row 2: static headers (rowspan via merge 2-3) + TW group headers
        $staticHeaders = ['No', 'Sasaran', 'Kode IKU', 'Indikator Kinerja', 'Satuan', 'Target PK', 'PIC Tim Kerja', 'Diisi Oleh'];
        $staticCols    = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
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
        $startRow        = 4;
        $currentRow      = $startRow;
        $no              = 1;
        $prevSasaranKode = null;
        $sasaranStartRow = $startRow;

        // Group rows by sasaran for merge
        $sasaranGroups = [];
        foreach ($dataRows as $dr) {
            $sasaranGroups[$dr['sasaran_kode']][] = $dr;
        }

        $dataCellStyle = [
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true, 'indent' => 1],
            'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];
        $centerCellStyle = [
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];

        foreach ($sasaranGroups as $sasaranKode => $rows) {
            $groupStartRow  = $currentRow;
            $groupSize      = count($rows);

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
                    $twInfo   = $dr['tw'][$tw];
                    $targetV  = $twInfo['target'] ?? '-';
                    $realV    = $twInfo['realisasi'] ?? '-';

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
            $sheet->getStyle("B{$groupStartRow}:B" . ($groupStartRow + $groupSize - 1))->applyFromArray([
                'font'      => ['bold' => true, 'size' => 12, 'name' => 'Times New Roman'],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true, 'indent' => 1],
                'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
            ]);
        }

        // ── Freeze panes ──────────────────────────────────────────────────────
        $sheet->freezePane('D4');

        // ── Output ────────────────────────────────────────────────────────────
        $filename = "Realisasi_Kinerja_{$tahun->tahun}.xlsx";

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'max-age=0',
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
            'sasarans'                       => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators'            => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators.picTimKerjas',
            'sasarans.indikators.realisasis' => fn ($q) => $q->with('inputByTimKerja')
                ->whereIn('periode_pengukuran_id', $periodeIds),
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        $matrix = [];

        foreach ($pks as $pk) {
            foreach ($pk->sasarans as $sasaran) {
                foreach ($sasaran->indikators as $iku) {
                    $realisasiByPeriode = $iku->realisasis->keyBy('periode_pengukuran_id');

                    $tw = [];
                    foreach (['TW1', 'TW2', 'TW3', 'TW4'] as $twKey) {
                        $p     = $allPeriodes->get($twKey);
                        $r     = $p ? $realisasiByPeriode->get($p->id) : null;
                        $tw[]  = [
                            'tw'        => $twKey,
                            'target'    => $iku->{'target_' . strtolower($twKey)},
                            'realisasi' => $r?->realisasi,
                        ];
                    }

                    $anyR     = $iku->realisasis->first();
                    $matrix[] = [
                        'sasaran_kode'       => $sasaran->kode,
                        'sasaran_nama'       => $sasaran->nama,
                        'iku_kode'           => $iku->kode,
                        'iku_nama'           => $iku->nama,
                        'iku_satuan'         => $iku->satuan,
                        'iku_target'         => $iku->target,
                        'pic_tim_kerjas'     => $iku->picTimKerjas->map(fn ($t) => $t->only(['id', 'nama'])),
                        'input_by_tim_kerja' => $anyR?->inputByTimKerja?->only(['id', 'nama']),
                        'tw'                 => $tw,
                    ];
                }
            }
        }

        return Inertia::render('SuperAdmin/Pengukuran/ExportPdf', [
            'tahun'  => $tahun,
            'matrix' => $matrix,
        ]);
    }
}
