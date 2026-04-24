<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\IndikatorKinerja;
use App\Models\MasterSasaran;
use App\Models\PerjanjianKinerja;
use App\Models\RencanaAksi;
use App\Models\RencanaAksiIndikator;
use App\Models\Sasaran;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class PerencanaanController extends Controller
{
    // ─── PK Awal ────────────────────────────────────────────────────────────────

    public function pkAwal(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjas = TimKerja::active()->orderBy('nama')->get(['id', 'nama', 'kode']);

        return Inertia::render('SuperAdmin/Perencanaan/PerjanjianKinerja/Awal/Penyusunan', [
            'tahun' => $tahun,
            'jenis' => 'awal',
            'timKerjas' => $timKerjas,
            'pks' => $this->buildPkStatusList($tahun->id, 'awal'),
            ...$this->buildFlatPkData($tahun->id, 'awal'),
        ]);
    }

    public function pkRevisi(): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjas = TimKerja::active()->orderBy('nama')->get(['id', 'nama', 'kode']);

        return Inertia::render('SuperAdmin/Perencanaan/PerjanjianKinerja/Revisi/Penyusunan', [
            'tahun' => $tahun,
            'jenis' => 'revisi',
            'timKerjas' => $timKerjas,
            'pks' => $this->buildPkStatusList($tahun->id, 'revisi'),
            ...$this->buildFlatPkData($tahun->id, 'revisi'),
        ]);
    }

    private function buildPkStatusList(int $tahunId, string $jenis): array
    {
        return PerjanjianKinerja::with('timKerja:id,nama,kode,nama_singkat')
            ->where('tahun_anggaran_id', $tahunId)
            ->where('jenis', $jenis)
            ->whereIn('status', ['submitted', 'kabag_approved', 'rejected'])
            ->orderBy('status')
            ->orderBy('id')
            ->get()
            ->map(fn ($pk) => [
                'id' => $pk->id,
                'status' => $pk->status,
                'rekomendasi_kabag' => $pk->rekomendasi_kabag,
                'tim_kerja' => $pk->timKerja ? [
                    'id' => $pk->timKerja->id,
                    'nama' => $pk->timKerja->nama,
                    'kode' => $pk->timKerja->kode,
                    'nama_singkat' => $pk->timKerja->nama_singkat,
                ] : null,
            ])
            ->values()
            ->all();
    }

    private function buildFlatPkData(int $tahunId, string $jenis): array
    {
        $pks = PerjanjianKinerja::with([
            'sasarans' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('kode'),
            'sasarans.indikators.picTimKerjas',
            'timKerja',
        ])
            ->where('tahun_anggaran_id', $tahunId)
            ->where('jenis', $jenis)
            ->orderBy('id')
            ->get();

        $sasaranMap = [];

        foreach ($pks as $pk) {
            foreach ($pk->sasarans as $sasaran) {
                if (! isset($sasaranMap[$sasaran->kode])) {
                    $sasaranMap[$sasaran->kode] = ['kode' => $sasaran->kode, 'nama' => $sasaran->nama, 'indikators' => []];
                }

                foreach ($sasaran->indikators as $iku) {
                    $sasaranMap[$sasaran->kode]['indikators'][] = [
                        'id' => $iku->id,
                        'kode' => $iku->kode,
                        'nama' => $iku->nama,
                        'satuan' => $iku->satuan,
                        'target' => $iku->target,
                        'sasaran_id' => $sasaran->id,
                        'pic_tim_kerjas' => $iku->picTimKerjas->values(),
                    ];
                }
            }
        }

        ksort($sasaranMap);

        // Master sasaran sebagai sumber tunggal untuk dropdown Tambah IKU
        $masterSasarans = MasterSasaran::where('tahun_anggaran_id', $tahunId)
            ->orderBy('urutan')
            ->get(['id', 'kode', 'nama'])
            ->toArray();

        return [
            'sasarans' => array_values($sasaranMap),
            'masterSasarans' => $masterSasarans,
        ];
    }

    // ─── Matriks PK ─────────────────────────────────────────────────────────────

    public function matriksPK(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $pks = PerjanjianKinerja::with(['sasarans.indikators.picTimKerjas', 'timKerja'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->orderBy('id')
            ->get();

        $timKerjas = TimKerja::active()->orderBy('nama')->get(['id', 'nama', 'kode']);

        return Inertia::render('SuperAdmin/Perencanaan/MatriksPK', [
            'tahun' => $tahun,
            'pks' => $pks,
            'timKerjas' => $timKerjas,
        ]);
    }

    // ─── Rencana Aksi ───────────────────────────────────────────────────────────

    public function rencanaAksi(): Response
    {
        $tahun = TahunAnggaran::forSession();

        // Gunakan SEMUA PK Awal sebagai sumber IKU (robust jika data tersebar di beberapa PK)
        $allPkAwal = PerjanjianKinerja::with([
            'sasarans' => fn ($q) => $q->orderBy('urutan'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('urutan'),
            'sasarans.indikators.picTimKerjas',
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        // Index RAI yang sudah terisi (dari semua RA, dikelompokkan per kode IKU)
        $raiByKode = RencanaAksiIndikator::with(['kegiatans', 'rencanaAksi.timKerja'])
            ->whereHas('rencanaAksi', fn ($q) => $q->where('tahun_anggaran_id', $tahun->id))
            ->get()
            ->groupBy('kode');

        $sasaranMap = [];

        foreach ($allPkAwal as $pkAwal) {
            foreach ($pkAwal->sasarans as $sasaran) {
                if (! isset($sasaranMap[$sasaran->kode])) {
                    $sasaranMap[$sasaran->kode] = ['kode' => $sasaran->kode, 'nama' => $sasaran->nama, 'indikators' => []];
                }

                foreach ($sasaran->indikators as $iku) {
                    // Pilih RAI dari primary PIC jika ada, fallback ke RAI apapun
                    $rais = $raiByKode->get($iku->kode, collect());
                    $rai = $rais->firstWhere('rencanaAksi.tim_kerja_id', $iku->pic_tim_kerja_id)
                             ?? $rais->first();

                    $sasaranMap[$sasaran->kode]['indikators'][] = [
                        'id' => $rai?->id,
                        'ra_id' => $rai?->rencana_aksi_id,
                        'kode' => $iku->kode,
                        'nama' => $iku->nama,
                        'satuan' => $iku->satuan,
                        'target' => $iku->target,
                        'target_tw1' => $rai?->target_tw1,
                        'target_tw2' => $rai?->target_tw2,
                        'target_tw3' => $rai?->target_tw3,
                        'target_tw4' => $rai?->target_tw4,
                        'pic_tim_kerjas' => $iku->picTimKerjas->values(),
                        'tim_kerja' => $rai?->rencanaAksi?->timKerja
                            ? ['id' => $rai->rencanaAksi->timKerja->id, 'nama' => $rai->rencanaAksi->timKerja->nama, 'kode' => $rai->rencanaAksi->timKerja->kode]
                            : null,
                        'kegiatans' => $rai ? $rai->kegiatans->map(fn ($k) => [
                            'id' => $k->id,
                            'triwulan' => $k->triwulan,
                            'urutan' => $k->urutan,
                            'nama_kegiatan' => $k->nama_kegiatan,
                        ])->values()->all() : [],
                    ];
                }
            }
        }

        // Status daftar RA per tim (untuk panel Buka Kembali)
        $ras = RencanaAksi::with('timKerja:id,nama,kode,nama_singkat')
            ->where('tahun_anggaran_id', $tahun->id)
            ->orderBy('id')
            ->get();

        $raStatusList = $ras->map(fn ($ra) => [
            'id' => $ra->id,
            'status' => $ra->status,
            'rekomendasi_kabag' => $ra->rekomendasi_kabag,
            'tim_kerja' => $ra->timKerja ? [
                'id' => $ra->timKerja->id,
                'nama' => $ra->timKerja->nama,
                'kode' => $ra->timKerja->kode,
                'nama_singkat' => $ra->timKerja->nama_singkat,
            ] : null,
        ])->values()->all();

        // Buang sasaran orphan (tanpa indikator)
        $sasaranMap = array_filter($sasaranMap, fn ($s) => count($s['indikators']) > 0);
        ksort($sasaranMap);

        return Inertia::render('SuperAdmin/Perencanaan/RencanaAksi/Penyusunan', [
            'tahun' => $tahun,
            'sasarans' => array_values($sasaranMap),
            'ras' => $raStatusList,
            'batasRa' => $tahun->batas_pengisian_ra?->toIso8601String(),
            'serverNow' => now()->toIso8601String(),
        ]);
    }

    // ─── Export Rencana Aksi XLSX ────────────────────────────────────────────────

    public function exportRaXls()
    {
        $tahun = TahunAnggaran::forSession();

        // ── Load semua PK Awal (sumber IKU) ───────────────────────────────────
        $allPkAwal = PerjanjianKinerja::with([
            'sasarans' => fn ($q) => $q->orderBy('urutan'),
            'sasarans.indikators' => fn ($q) => $q->orderBy('urutan'),
            'sasarans.indikators.picTimKerjas',
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('jenis', 'awal')
            ->get();

        $statusPriority = ['kabag_approved' => 3, 'submitted' => 2, 'rejected' => 1, 'draft' => 0];

        // ── Lookup status RA per tim_kerja (selaras logika UI) ────────────────
        // UI menentukan status IKU dari RA terbaik di antara SEMUA PIC teams,
        // bukan dari apakah tim itu punya RAI untuk IKU tertentu.
        $raByTimKerjaId = RencanaAksi::where('tahun_anggaran_id', $tahun->id)
            ->get()
            ->groupBy('tim_kerja_id');

        // Helper: status terbaik dari sekumpulan PIC teams (selaras UI getBestRa)
        $bestStatusForPics = function ($picTimKerjas) use ($raByTimKerjaId, $statusPriority): ?string {
            $bestPriority = -1;
            $bestStatus   = null;
            foreach ($picTimKerjas as $team) {
                foreach ($raByTimKerjaId->get($team->id, collect()) as $ra) {
                    $p = $statusPriority[$ra->status] ?? -1;
                    if ($p > $bestPriority) {
                        $bestPriority = $p;
                        $bestStatus   = $ra->status;
                    }
                }
            }
            return $bestStatus;
        };

        // ── Index RAI by kode — pilih yang terbaik untuk data target & kegiatan ─
        $raiByKode = RencanaAksiIndikator::with([
            'kegiatans' => fn ($q) => $q->orderBy('triwulan')->orderBy('urutan'),
            'rencanaAksi.timKerja',
        ])
            ->whereHas('rencanaAksi', fn ($q) => $q->where('tahun_anggaran_id', $tahun->id))
            ->get()
            ->groupBy('kode');

        // Pilih RAI dengan status tertinggi untuk mengambil data target & kegiatan
        $bestRai = fn ($kode) => $raiByKode->get($kode, collect())
            ->sortByDesc(fn ($r) => $statusPriority[$r->rencanaAksi?->status] ?? -1)
            ->first();

        // ── Bangun sasaran map (dedup by kode) ────────────────────────────────
        $sasaranMap = [];
        foreach ($allPkAwal as $pkAwal) {
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
                        continue;
                    }
                    $rai      = $bestRai($iku->kode);
                    $picNames = $iku->picTimKerjas->map(fn ($t) => $t->nama)->join(', ');

                    // Status: ikuti logika UI — cek semua PIC teams, ambil status tertinggi
                    $raStatus = $bestStatusForPics($iku->picTimKerjas);

                    $twKegiatan = [];
                    for ($tw = 1; $tw <= 4; $tw++) {
                        $twKegiatan[$tw] = $rai
                            ? $rai->kegiatans->where('triwulan', $tw)->values()
                            : collect();
                    }
                    $sasaranMap[$sasaran->kode]['indikators'][$iku->kode] = [
                        'iku_kode' => $iku->kode,
                        'iku_nama' => $iku->nama,
                        'iku_satuan' => $iku->satuan,
                        'iku_target' => $iku->target,
                        'pic_names' => $picNames ?: '-',
                        'tim_kerja_nama' => $rai?->rencanaAksi?->timKerja?->nama ?? '-',
                        'target_tw1' => $rai?->target_tw1,
                        'target_tw2' => $rai?->target_tw2,
                        'target_tw3' => $rai?->target_tw3,
                        'target_tw4' => $rai?->target_tw4,
                        'ra_status' => $raStatus,
                        'tw_kegiatan' => $twKegiatan,
                    ];
                }
            }
        }
        uksort($sasaranMap, 'strnatcmp');
        foreach ($sasaranMap as &$s) {
            uksort($s['indikators'], 'strnatcmp');
        }
        unset($s);

        // Flatten rows
        $dataRows = [];
        foreach ($sasaranMap as $sasaran) {
            foreach ($sasaran['indikators'] as $iku) {
                $dataRows[] = array_merge(['sasaran_kode' => $sasaran['kode'], 'sasaran_nama' => $sasaran['nama']], $iku);
            }
        }

        // ── Status label map ──────────────────────────────────────────────────
        $statusLabels = [
            'draft'          => 'Draft',
            'submitted'      => 'Menunggu Kabag',
            'kabag_approved' => 'Disetujui',
            'rejected'       => 'Ditolak',
        ];

        // ── Spreadsheet ───────────────────────────────────────────────────────
        $spreadsheet = new Spreadsheet;
        $spreadsheet->getDefaultStyle()->getFont()->setName('Times New Roman')->setSize(12);
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Rencana Aksi Kinerja');

        // ── Shared styles (selaras dengan export Pengukuran) ──────────────────
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
        $dataCellStyle = [
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true, 'indent' => 1],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];
        $centerCellStyle = [
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ];

        // ── Title row ─────────────────────────────────────────────────────────
        // Columns A–M (13 total)
        $sheet->mergeCells('A1:M1');
        $sheet->setCellValue('A1', "Rencana Aksi Kinerja — {$tahun->label}");
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 13, 'name' => 'Times New Roman', 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '003580']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);

        // ── Header row 2–3 ────────────────────────────────────────────────────
        // Static columns merged rows 2:3: No, Sasaran, Kode IKU, Indikator, Satuan, Target Tahunan, PIC Tim Kerja, Tim Kerja Pengisi
        $staticHeaders = ['No', 'Sasaran', 'Kode IKU', 'Indikator Kinerja', 'Satuan', 'Target Tahunan', 'PIC Tim Kerja', 'Tim Kerja Pengisi'];
        $staticCols    = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        foreach ($staticHeaders as $i => $label) {
            $col = $staticCols[$i];
            $sheet->mergeCells("{$col}2:{$col}3");
            $sheet->setCellValue("{$col}2", $label);
            $sheet->getStyle("{$col}2:{$col}3")->applyFromArray($headerStyle);
        }

        // TW group header: "Target Rencana Aksi per Triwulan" (I2:L2)
        $sheet->mergeCells('I2:L2');
        $sheet->setCellValue('I2', 'Target Rencana Aksi per Triwulan');
        $sheet->getStyle('I2:L2')->applyFromArray($headerStyle);

        // TW sub-headers (row 3)
        foreach (['I' => 'TW I', 'J' => 'TW II', 'K' => 'TW III', 'L' => 'TW IV'] as $col => $label) {
            $sheet->setCellValue("{$col}3", $label);
            $sheet->getStyle("{$col}3")->applyFromArray($subHeaderStyle);
        }

        // Status RA (M, merged 2:3)
        $sheet->mergeCells('M2:M3');
        $sheet->setCellValue('M2', 'Status RA');
        $sheet->getStyle('M2:M3')->applyFromArray($headerStyle);

        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getRowDimension(3)->setRowHeight(18);

        // ── Column widths ──────────────────────────────────────────────────────
        foreach ([
            'A' => 5, 'B' => 35, 'C' => 10, 'D' => 50, 'E' => 10,
            'F' => 12, 'G' => 35, 'H' => 30,
            'I' => 12, 'J' => 12, 'K' => 12, 'L' => 12,
            'M' => 14,
        ] as $col => $w) {
            $sheet->getColumnDimension($col)->setWidth($w);
        }

        // ── Data rows ─────────────────────────────────────────────────────────
        $startRow    = 4;
        $currentRow  = $startRow;
        $no          = 1;

        $sasaranGroups = [];
        foreach ($dataRows as $dr) {
            $sasaranGroups[$dr['sasaran_kode']][] = $dr;
        }

        foreach ($sasaranGroups as $sasaranKode => $rows) {
            $groupStartRow = $currentRow;
            $groupSize     = count($rows);

            foreach ($rows as $dr) {
                $sheet->getRowDimension($currentRow)->setRowHeight(-1);

                $sheet->setCellValue("A{$currentRow}", $no++);
                $sheet->getStyle("A{$currentRow}")->applyFromArray($centerCellStyle);

                if ($currentRow === $groupStartRow) {
                    $sheet->setCellValue("B{$currentRow}", "{$dr['sasaran_kode']} — {$dr['sasaran_nama']}");
                }

                $sheet->setCellValue("C{$currentRow}", $dr['iku_kode']);
                $sheet->getStyle("C{$currentRow}")->applyFromArray($centerCellStyle);

                $sheet->setCellValue("D{$currentRow}", $dr['iku_nama']);
                $sheet->getStyle("D{$currentRow}")->applyFromArray($dataCellStyle);

                $sheet->setCellValue("E{$currentRow}", $dr['iku_satuan']);
                $sheet->getStyle("E{$currentRow}")->applyFromArray($centerCellStyle);

                $sheet->setCellValue("F{$currentRow}", $dr['iku_target'] ?? '-');
                $sheet->getStyle("F{$currentRow}")->applyFromArray($centerCellStyle);

                $sheet->setCellValue("G{$currentRow}", $dr['pic_names']);
                $sheet->getStyle("G{$currentRow}")->applyFromArray($dataCellStyle);

                $sheet->setCellValue("H{$currentRow}", $dr['tim_kerja_nama']);
                $sheet->getStyle("H{$currentRow}")->applyFromArray($centerCellStyle);

                foreach (['I' => 'target_tw1', 'J' => 'target_tw2', 'K' => 'target_tw3', 'L' => 'target_tw4'] as $col => $key) {
                    $sheet->setCellValue("{$col}{$currentRow}", $dr[$key] ?? '-');
                    $sheet->getStyle("{$col}{$currentRow}")->applyFromArray($centerCellStyle);
                }

                $statusLabel = $dr['ra_status'] ? ($statusLabels[$dr['ra_status']] ?? $dr['ra_status']) : 'Belum Ada RA';
                $sheet->setCellValue("M{$currentRow}", $statusLabel);
                $sheet->getStyle("M{$currentRow}")->applyFromArray($centerCellStyle);

                $currentRow++;
            }

            // Merge Sasaran column for group
            if ($groupSize > 1) {
                $endRow = $groupStartRow + $groupSize - 1;
                $sheet->mergeCells("B{$groupStartRow}:B{$endRow}");
            }
            $sheet->getStyle("B{$groupStartRow}:B".($groupStartRow + $groupSize - 1))->applyFromArray([
                'font' => ['bold' => true, 'size' => 12, 'name' => 'Times New Roman'],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true, 'indent' => 1],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
            ]);
        }

        $sheet->freezePane('D4');

        // ── Sheet 2–5: Rencana Kegiatan per Triwulan ──────────────────────────
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

        $twSheetNames  = [1 => 'Kegiatan TW I', 2 => 'Kegiatan TW II', 3 => 'Kegiatan TW III', 4 => 'Kegiatan TW IV'];
        $twSheetTitles = [
            1 => 'Rencana Kegiatan Triwulan I',
            2 => 'Rencana Kegiatan Triwulan II',
            3 => 'Rencana Kegiatan Triwulan III',
            4 => 'Rencana Kegiatan Triwulan IV',
        ];

        foreach ([1, 2, 3, 4] as $tw) {
            if (empty($dataRows)) {
                continue;
            }

            $shTw = $spreadsheet->createSheet();
            $shTw->setTitle($twSheetNames[$tw]);

            // Title
            $shTw->mergeCells('A1:E1');
            $shTw->setCellValue('A1', $twSheetTitles[$tw]." — {$tahun->label}");
            $shTw->getStyle('A1:E1')->applyFromArray([
                'font' => ['bold' => true, 'size' => 13, 'name' => 'Times New Roman', 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '003580']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
            ]);
            $shTw->getRowDimension(1)->setRowHeight(30);

            // Header
            foreach (['A' => 'No', 'B' => 'Kode IKU', 'C' => 'Indikator Kinerja Utama', 'D' => 'Tim Kerja PIC', 'E' => 'Rencana Kegiatan'] as $col => $label) {
                $shTw->setCellValue("{$col}2", $label);
                $shTw->getStyle("{$col}2")->applyFromArray($headerStyle);
            }
            $shTw->getRowDimension(2)->setRowHeight(22);

            // Column widths
            foreach (['A' => 5, 'B' => 12, 'C' => 52, 'D' => 26, 'E' => 68] as $col => $w) {
                $shTw->getColumnDimension($col)->setWidth($w);
            }

            // Data rows
            $rowTw         = 3;
            $noTw          = 1;
            $prevSasaranTw = null;

            foreach ($dataRows as $dr) {
                if ($dr['sasaran_kode'] !== $prevSasaranTw) {
                    $shTw->mergeCells("A{$rowTw}:E{$rowTw}");
                    $shTw->setCellValue("A{$rowTw}", $dr['sasaran_kode'].'   —   '.$dr['sasaran_nama']);
                    $shTw->getStyle("A{$rowTw}:E{$rowTw}")->applyFromArray($kgSasaranHeaderStyle);
                    $shTw->getRowDimension($rowTw)->setRowHeight(18);
                    $rowTw++;
                    $prevSasaranTw = $dr['sasaran_kode'];
                }

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
                $shTw->getRowDimension($rowTw)->setRowHeight(-1);

                $rowTw++;
            }

            $shTw->freezePane('A3');
        }

        $spreadsheet->setActiveSheetIndex(0);

        $filename = "Rencana_Aksi_{$tahun->tahun}.xlsx";
        $writer   = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'max-age=0',
        ]);
    }

    // ─── RA Batas Pengisian ──────────────────────────────────────────────────────

    public function raBatasUpdate(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();

        $data = $request->validate([
            'batas_pengisian_ra' => ['nullable', 'date'],
        ]);

        // Normalisasi datetime-local (YYYY-MM-DDTHH:MM) ke format Y-m-d H:i:s
        // lalu konversi dari WIB (Asia/Jakarta) ke UTC sebelum disimpan.
        // Ini penting karena input datetime-local selalu dalam waktu lokal browser (WIB).
        if (! empty($data['batas_pengisian_ra'])) {
            $raw = str_replace('T', ' ', (string) $data['batas_pengisian_ra']);
            if (! str_contains($raw, ':')) {
                $raw .= ' 00:00:00';
            } elseif (substr_count($raw, ':') === 1) {
                $raw .= ':00';
            }
            $data['batas_pengisian_ra'] = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $raw, 'Asia/Jakarta')
                ->setTimezone('UTC')
                ->format('Y-m-d H:i:s');
        }

        $tahun->update(['batas_pengisian_ra' => $data['batas_pengisian_ra'] ?: null]);

        return back()->with('success', $data['batas_pengisian_ra']
            ? 'Batas waktu pengisian RA berhasil disimpan.'
            : 'Batas waktu pengisian RA berhasil dihapus.');
    }

    // ─── Master Sasaran CRUD ─────────────────────────────────────────────────────

    public function masterSasaranStore(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();

        $data = $request->validate([
            'kode' => ['required', 'string', 'max:10'],
            'nama' => ['required', 'string', 'max:500'],
        ]);

        $urutan = MasterSasaran::where('tahun_anggaran_id', $tahun->id)->max('urutan') + 1;

        MasterSasaran::create([
            'tahun_anggaran_id' => $tahun->id,
            'kode' => $data['kode'],
            'nama' => $data['nama'],
            'urutan' => $urutan,
        ]);

        return back()->with('success', "Sasaran {$data['kode']} berhasil ditambahkan ke master.");
    }

    public function masterSasaranUpdate(Request $request, MasterSasaran $masterSasaran): RedirectResponse
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'max:10'],
            'nama' => ['required', 'string', 'max:500'],
        ]);

        $masterSasaran->update($data);

        return back()->with('success', 'Master sasaran berhasil diperbarui.');
    }

    public function masterSasaranDestroy(MasterSasaran $masterSasaran): RedirectResponse
    {
        $masterSasaran->delete();

        return back()->with('success', 'Master sasaran berhasil dihapus.');
    }

    // ─── Indikator CRUD ─────────────────────────────────────────────────────────

    public function indikatorStore(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();

        $data = $request->validate([
            'master_sasaran_id' => ['required', 'integer', 'exists:master_sasaran,id'],
            'jenis' => ['required', 'in:awal,revisi'],
            'kode' => ['required', 'string', 'max:30'],
            'nama' => ['required', 'string', 'max:500'],
            'satuan' => ['required', 'string', 'max:50'],
            'target' => ['required', 'string', 'max:50'],
            'target_tw1' => ['nullable', 'string', 'max:50'],
            'target_tw2' => ['nullable', 'string', 'max:50'],
            'target_tw3' => ['nullable', 'string', 'max:50'],
            'target_tw4' => ['nullable', 'string', 'max:50'],
            'pic_tim_kerja_ids' => ['required', 'array', 'min:1'],
            'pic_tim_kerja_ids.*' => ['integer', 'exists:tim_kerja,id'],
        ]);

        $masterSasaran = MasterSasaran::findOrFail($data['master_sasaran_id']);
        $picIds = $data['pic_tim_kerja_ids'];
        $primaryPicId = $picIds[0];

        // Temukan atau buat PK milik primary PIC untuk tahun & jenis ini
        $pk = PerjanjianKinerja::firstOrCreate(
            ['tahun_anggaran_id' => $tahun->id, 'tim_kerja_id' => $primaryPicId, 'jenis' => $data['jenis']],
            ['status' => 'draft', 'created_by' => $request->user()->id]
        );

        // Temukan atau buat sasaran di PK tersebut berdasarkan master sasaran
        $sasaran = Sasaran::firstOrCreate(
            ['perjanjian_kinerja_id' => $pk->id, 'kode' => $masterSasaran->kode],
            ['nama' => $masterSasaran->nama, 'urutan' => $masterSasaran->urutan]
        );

        $urutan = $sasaran->indikators()->max('urutan') + 1;
        $indikator = IndikatorKinerja::create([
            'sasaran_id' => $sasaran->id,
            'kode' => $data['kode'],
            'nama' => $data['nama'],
            'satuan' => $data['satuan'],
            'target' => $data['target'],
            'target_tw1' => $data['target_tw1'] ?? null,
            'target_tw2' => $data['target_tw2'] ?? null,
            'target_tw3' => $data['target_tw3'] ?? null,
            'target_tw4' => $data['target_tw4'] ?? null,
            'urutan' => $urutan,
            'pic_tim_kerja_id' => $primaryPicId,
        ]);

        $indikator->picTimKerjas()->sync($picIds);

        return back()->with('success', 'Indikator berhasil ditambahkan.');
    }

    public function indikatorUpdate(Request $request, IndikatorKinerja $indikator): RedirectResponse
    {
        $data = $request->validate([
            'kode' => ['required', 'string', 'max:30'],
            'nama' => ['required', 'string', 'max:500'],
            'satuan' => ['required', 'string', 'max:50'],
            'target' => ['required', 'string', 'max:50'],
            'target_tw1' => ['nullable', 'string', 'max:50'],
            'target_tw2' => ['nullable', 'string', 'max:50'],
            'target_tw3' => ['nullable', 'string', 'max:50'],
            'target_tw4' => ['nullable', 'string', 'max:50'],
            'pic_tim_kerja_ids' => ['nullable', 'array'],
            'pic_tim_kerja_ids.*' => ['integer', 'exists:tim_kerja,id'],
        ]);

        $picIds = $data['pic_tim_kerja_ids'] ?? [];
        $oldKode = $indikator->kode;
        $newKode = $data['kode'];
        $tahunId = $indikator->sasaran->perjanjianKinerja->tahun_anggaran_id;

        $indikator->update([
            'kode' => $newKode,
            'nama' => $data['nama'],
            'satuan' => $data['satuan'],
            'target' => $data['target'],
            'target_tw1' => $data['target_tw1'] ?? null,
            'target_tw2' => $data['target_tw2'] ?? null,
            'target_tw3' => $data['target_tw3'] ?? null,
            'target_tw4' => $data['target_tw4'] ?? null,
            'pic_tim_kerja_id' => $picIds[0] ?? null,
        ]);

        $indikator->picTimKerjas()->sync($picIds);

        // Sinkronisasi kode RAI jika kode IKU berubah, agar data di Rencana Aksi tetap konsisten.
        if ($oldKode !== $newKode) {
            RencanaAksiIndikator::whereHas(
                'rencanaAksi', fn ($q) => $q->where('tahun_anggaran_id', $tahunId)
            )->where('kode', $oldKode)->update(['kode' => $newKode]);
        }

        return back()->with('success', 'Indikator berhasil diperbarui.');
    }

    public function indikatorDestroy(IndikatorKinerja $indikator): RedirectResponse
    {
        $kode    = $indikator->kode;
        $tahunId = $indikator->sasaran->perjanjianKinerja->tahun_anggaran_id;

        // Hapus RAI dengan kode yang sama agar data Rencana Aksi tidak menyimpan IKU orphan.
        RencanaAksiIndikator::whereHas(
            'rencanaAksi', fn ($q) => $q->where('tahun_anggaran_id', $tahunId)
        )->where('kode', $kode)->delete();

        $indikator->delete();

        return back()->with('success', 'Indikator berhasil dihapus.');
    }

    public function indikatorUpdatePic(Request $request, IndikatorKinerja $indikator): RedirectResponse
    {
        $data = $request->validate([
            'pic_tim_kerja_id' => ['nullable', 'integer', 'exists:tim_kerja,id'],
        ]);

        $indikator->update(['pic_tim_kerja_id' => $data['pic_tim_kerja_id']]);

        return back()->with('success', 'PIC Tim Kerja berhasil diperbarui.');
    }

    // ─── PK Reopen ──────────────────────────────────────────────────────────────

    public function pkReopen(PerjanjianKinerja $pk): RedirectResponse
    {
        abort_if(
            ! in_array($pk->status, ['submitted', 'kabag_approved']),
            422,
            'Hanya dokumen yang sedang diproses atau sudah disetujui yang dapat dibuka kembali.'
        );
        $pk->update(['status' => 'draft', 'rekomendasi_kabag' => null]);

        return back()->with('success', "PK {$pk->timKerja->nama_singkat} berhasil dibuka kembali ke Draft.");
    }

    // ─── RA Reopen ──────────────────────────────────────────────────────────────

    public function raReopen(RencanaAksi $ra): RedirectResponse
    {
        abort_if(
            ! in_array($ra->status, ['submitted', 'kabag_approved']),
            422,
            'Hanya dokumen yang sedang diproses atau sudah disetujui yang dapat dibuka kembali.'
        );
        $ra->update(['status' => 'draft', 'rekomendasi_kabag' => null, 'rejected_by' => null]);

        $nama = $ra->timKerja?->nama_singkat ?? $ra->timKerja?->nama ?? 'Tim Kerja';

        return back()->with('success', "RA {$nama} berhasil dibuka kembali ke Draft.");
    }
}
