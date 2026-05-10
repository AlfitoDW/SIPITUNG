<?php

namespace App\Http\Controllers\Bendahara;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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
 * pic_approved → upload bukti bayar → dicairkan
 */
class PermohonanDanaController extends Controller
{
    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $baseQuery = PermohonanDana::with([
            'items', 'timKerja.ketua', 'createdBy', 'picApprovedBy', 'dicairkanBy', 'buktiBayarUploadedBy', 'picKeuangan',
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->orderByDesc('created_at');

        $mapFn = function ($pd) {
            return array_merge($pd->toArray(), [
                'status_label' => $pd->status_label,
                'next_approver_role' => match ($pd->status) {
                    'submitted' => 'KA.TIM',
                    'katim_approved' => 'Kabag Umum',
                    'kabag_approved' => 'PPK',
                    'ppk_approved' => 'PIC Keuangan',
                    'pic_approved' => 'Bendahara',
                    default => null,
                },
                'next_approver_name' => match ($pd->status) {
                    'submitted' => $pd->timKerja?->ketua?->nama_lengkap,
                    'katim_approved' => User::where('role', 'pimpinan')->where('pimpinan_type', 'kabag_umum')->where('is_active', true)->value('nama_lengkap'),
                    'kabag_approved' => User::where('role', 'pimpinan')->where('pimpinan_type', 'ppk')->where('is_active', true)->value('nama_lengkap'),
                    'ppk_approved' => $pd->picKeuangan?->nama_lengkap,
                    'pic_approved' => User::where('role', 'bendahara')->where('is_active', true)->value('nama_lengkap'),
                    default => null,
                },
            ]);
        };

        $perluDiproses = (clone $baseQuery)
            ->where('status', 'pic_approved')
            ->get()
            ->map($mapFn);

        $semuaAjuan = (clone $baseQuery)
            ->get()
            ->map($mapFn);

        $diajukan = (clone $baseQuery)
            ->whereIn('status', ['submitted', 'katim_approved', 'kabag_approved', 'ppk_approved', 'pic_approved'])
            ->get()
            ->map($mapFn);

        $revisi = (clone $baseQuery)
            ->where('status', 'rejected')
            ->get()
            ->map($mapFn);

        $selesai = (clone $baseQuery)
            ->where('status', 'dicairkan')
            ->get()
            ->map($mapFn);

        return Inertia::render('Bendahara/PermohonanDana/Index', [
            'tahun' => $tahun,
            'perluDiproses' => $perluDiproses,
            'semuaAjuan' => $semuaAjuan,
            'diajukan' => $diajukan,
            'revisi' => $revisi,
            'selesai' => $selesai,
        ]);
    }

    public function show(PermohonanDana $pd): Response
    {
        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan', 'items', 'dokumens', 'createdBy',
            'katimApprovedBy', 'kabagApprovedBy', 'ppkApprovedBy', 'picApprovedBy', 'dicairkanBy',
        ]);

        return Inertia::render('Bendahara/PermohonanDana/Detail', [
            'pd' => [
                'id' => $pd->id,
                'nomor_permohonan' => $pd->nomor_permohonan,
                'keperluan' => $pd->keperluan,
                'judul_pekerjaan' => $pd->judul_pekerjaan,
                'tanggal_mulai' => $pd->tanggal_mulai?->toDateString(),
                'tanggal_selesai' => $pd->tanggal_selesai?->toDateString(),
                'jam_pelaksanaan' => $pd->jam_pelaksanaan,
                'tempat' => $pd->tempat,
                'tgl_pertanggungjawaban' => $pd->tgl_pertanggungjawaban?->toDateString(),
                'total_anggaran' => $pd->total_anggaran,
                'status' => $pd->status,
                'status_label' => $pd->status_label,
                'catatan_katim' => $pd->catatan_katim,
                'catatan_kabag' => $pd->catatan_kabag,
                'catatan_ppk' => $pd->catatan_ppk,
                'catatan_pic' => $pd->catatan_pic,
                'catatan_pencairan' => $pd->catatan_pencairan,
                'catatan_penolakan' => $pd->catatan_penolakan,
                'created_at' => $pd->created_at?->toIso8601String(),
                'submitted_at' => $pd->submitted_at?->toIso8601String(),
                'created_by_name' => $pd->createdBy?->nama_lengkap,
                'kapokja_id' => $pd->kapokja_id,
                'kapokja_name' => $pd->kapokja?->nama_lengkap,
                'tim_kerja_kode' => $pd->timKerja?->kode,
                'tim_kerja_nama' => $pd->timKerja?->nama,
                // Approval timestamps
                'katim_approved_by' => $pd->katim_approved_by,
                'katim_approved_at' => $pd->katim_approved_at?->toIso8601String(),
                'katim_approved_by_name' => $pd->katimApprovedBy?->nama_lengkap,
                'kabag_approved_by' => $pd->kabag_approved_by,
                'kabag_approved_at' => $pd->kabag_approved_at?->toIso8601String(),
                'kabag_approved_by_name' => $pd->kabagApprovedBy?->nama_lengkap,
                'ppk_approved_by' => $pd->ppk_approved_by,
                'ppk_approved_at' => $pd->ppk_approved_at?->toIso8601String(),
                'ppk_approved_by_name' => $pd->ppkApprovedBy?->nama_lengkap,
                'pic_approved_by' => $pd->pic_approved_by,
                'pic_approved_at' => $pd->pic_approved_at?->toIso8601String(),
                'pic_approved_by_name' => $pd->picApprovedBy?->nama_lengkap,
                'dicairkan_by' => $pd->dicairkan_by,
                'dicairkan_at' => $pd->dicairkan_at?->toIso8601String(),
                'dicairkan_by_name' => $pd->dicairkanBy?->nama_lengkap,
                'rejected_at' => $pd->rejected_at?->toIso8601String(),
                'rejected_at_step' => $pd->rejected_at_step,
                // DJA
                'dja_program' => $pd->djaProgram ? ['nama' => $pd->djaProgram->nama] : null,
                'dja_sasaran' => $pd->djaSasaran ? ['nama' => $pd->djaSasaran->nama] : null,
                'dja_kro' => $pd->djaKro ? ['kode' => $pd->djaKro->kode, 'nama' => $pd->djaKro->nama] : null,
                'dja_ro' => $pd->djaRo ? ['nama' => $pd->djaRo->nama] : null,
                'dja_komponen' => $pd->djaKomponen ? ['nama' => $pd->djaKomponen->nama] : null,
                'dja_kegiatan' => $pd->djaKegiatan ? ['kode' => $pd->djaKegiatan->kode, 'nama' => $pd->djaKegiatan->nama] : null,
                'kapokja' => $pd->kapokja ? ['id' => $pd->kapokja->id, 'nama_lengkap' => $pd->kapokja->nama_lengkap] : null,
                'pic_keuangan' => $pd->picKeuangan ? ['id' => $pd->picKeuangan->id, 'nama_lengkap' => $pd->picKeuangan->nama_lengkap] : null,
                'items' => $pd->items->map(fn ($i) => [
                    'id' => $i->id,
                    'kode_akun' => $i->kode_akun,
                    'uraian' => $i->uraian,
                    'volume' => $i->volume,
                    'satuan' => $i->satuan,
                    'harga_satuan' => $i->harga_satuan,
                    'total' => $i->total,
                ])->values(),
                'dokumens' => $pd->dokumens->map(fn ($d) => [
                    'id' => $d->id,
                    'nama_jenis' => $d->nama_jenis,
                    'nama_file' => $d->nama_file,
                    'path_file' => $d->path_file,
                ])->values(),
                // Bukti bayar
                'bukti_bayar_path' => $pd->bukti_bayar_path,
                'bukti_bayar_uploaded_at' => $pd->bukti_bayar_uploaded_at?->toIso8601String(),
                'bukti_bayar_uploaded_by_name' => $pd->buktiBayarUploadedBy?->nama_lengkap,
            ],
        ]);
    }

    public function print(PermohonanDana $pd): Response
    {
        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan', 'items', 'dokumens',
            'katimApprovedBy', 'kabagApprovedBy', 'ppkApprovedBy', 'picApprovedBy', 'dicairkanBy',
        ]);

        return Inertia::render('Bendahara/PermohonanDana/PrintPreview', [
            'pd' => array_merge($pd->toArray(), ['status_label' => $pd->status_label]),
        ]);
    }

    public function cairkan(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'pic_approved', 422, 'Hanya permohonan berstatus Diverifikasi PIC yang dapat dicairkan.');

        $request->validate([
            'bukti_bayar' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ]);

        // Upload bukti bayar jika ada
        if ($request->hasFile('bukti_bayar')) {
            /** @var UploadedFile $file */
            $file = $request->file('bukti_bayar');
            $path = $file->store('bukti-bayar/'.date('Y/m'), 'public');

            $pd->update([
                'bukti_bayar_path' => $path,
                'bukti_bayar_uploaded_at' => now(),
                'bukti_bayar_uploaded_by' => $request->user()->id,
            ]);
        }

        // Validasi: harus ada bukti bayar (upload sekarang atau sudah ada sebelumnya)
        abort_if(! $pd->bukti_bayar_path, 422, 'Bukti bayar wajib diupload sebelum mencairkan dana.');

        $pd->update([
            'status' => 'dicairkan',
            'dicairkan_by' => $request->user()->id,
            'catatan_pencairan' => $request->catatan,
            'dicairkan_at' => now(),
        ]);

        return back()->with('success', "Dana untuk permohonan {$pd->nomor_permohonan} berhasil dicairkan.");
    }

    public function reject(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'pic_approved', 422, 'Hanya permohonan berstatus Diverifikasi PIC yang dapat ditolak.');

        $request->validate(['catatan' => 'required|string|max:1000']);

        $pd->update([
            'status' => 'rejected',
            'dicairkan_by' => $request->user()->id,
            'catatan_penolakan' => $request->catatan,
            'rejected_at_step' => 'bendahara',
            'catatan_pencairan' => $request->catatan,
            'rejected_at' => now(),
        ]);

        return back()->with('success', "Permohonan {$pd->nomor_permohonan} ditolak, dikembalikan ke PUMK.");
    }

    public function hapusBuktiBayar(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->status !== 'dicairkan', 422, 'Hanya permohonan berstatus Selesai yang dapat dihapus bukti bayarnya.');
        abort_if(! $pd->bukti_bayar_path, 422, 'Tidak ada bukti bayar untuk dihapus.');

        // Hapus file dari storage
        if (Storage::disk('public')->exists($pd->bukti_bayar_path)) {
            Storage::disk('public')->delete($pd->bukti_bayar_path);
        }

        // Revert ke status sebelum dicairkan
        $pd->update([
            'status' => 'pic_approved',
            'bukti_bayar_path' => null,
            'bukti_bayar_uploaded_at' => null,
            'bukti_bayar_uploaded_by' => null,
            'dicairkan_by' => null,
            'dicairkan_at' => null,
            'catatan_pencairan' => null,
        ]);

        return back()->with('success', "Bukti bayar permohonan {$pd->nomor_permohonan} dihapus. Status dikembalikan ke Menunggu Pencairan.");
    }

    // ─── Download Daftar Nominatif ────────────────────────────────────────────────

    public function nominatif(PermohonanDana $pd)
    {
        abort_if(! in_array($pd->status, ['pic_approved', 'dicairkan']), 403, 'Nominatif hanya tersedia setelah diverifikasi PIC.');

        $pd->load([
            'items.nominatif',
            'items.djaRincianBiaya',
            'timKerja',
            'djaKegiatan',
            'ppkApprovedBy',
        ]);

        $ppk = $pd->ppkApprovedBy;
        $bendahara = User::where('role', 'bendahara')->where('is_active', true)->first();
        $tglNominatif = $pd->tgl_nominatif
            ? $pd->tgl_nominatif->locale('id')->isoFormat('D MMMM YYYY')
            : now()->locale('id')->isoFormat('D MMMM YYYY');

        $tahun = $pd->tanggal_mulai ? substr($pd->tanggal_mulai, 0, 4) : now()->year;

        // Kelompokkan items berdasarkan kode_akun (hanya yang honor atau perjadin)
        $honorAkun = ['521115', '521213', '522151'];
        $perjadinAkun = ['524111', '524119', '524113'];
        $allNominatifAkun = array_merge($honorAkun, $perjadinAkun);

        $grouped = $pd->items
            ->filter(fn ($item) => in_array($item->kode_akun, $allNominatifAkun))
            ->groupBy('kode_akun');

        $spreadsheet = new Spreadsheet;
        $spreadsheet->removeSheetByIndex(0);

        $sheetIdx = 0;
        foreach ($grouped as $kodeAkun => $items) {
            $isHonor = in_array($kodeAkun, $honorAkun);
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
                default => strtoupper($kodeAkun),
            };

            $firstItem = $items->first();
            $namaItem = $firstItem->djaRincianBiaya?->nama_item ?? $firstItem->uraian ?? '-';
            $noSk = $pd->no_sk ?? '-';
            $tglSk = $pd->tgl_sk ? $this->formatTanggalIndo($pd->tgl_sk) : '-';
            $noSt = $pd->no_st ?? '-';
            $tglSt = $pd->tgl_st ? $this->formatTanggalIndo($pd->tgl_st) : '-';
            $nomorSurat = $isHonor ? "Nomor : {$noSk} Tanggal {$tglSk}" : "Nomor : {$noSt} Tanggal {$tglSt}";

            $tglPelaksanaan = '';
            if ($pd->tanggal_mulai && $pd->tanggal_selesai) {
                $tglMulai = $this->formatTanggalIndo($pd->tanggal_mulai);
                $tglSelesai = $this->formatTanggalIndo($pd->tanggal_selesai);
                $tglPelaksanaan = $tglMulai === $tglSelesai ? strtoupper($tglMulai) : strtoupper("{$tglMulai} S.D. {$tglSelesai}");
            }

            // ── Header baris 1–9 ─────────────────────────────────────────────
            $sheet->setCellValue('A1', 'Lampiran :');
            $sheet->setCellValue('A2', 'Surat Keputusan Kepala LLDIKTI Wilayah III selaku KPA');
            $sheet->setCellValue('A3', $nomorSurat);
            $sheet->setCellValue('A5', "DAFTAR PEMBAYARAN {$judul}");
            $sheet->setCellValue('A6', 'KEGIATAN '.strtoupper($pd->keperluan));
            $sheet->setCellValue('A7', "DI LINGKUNGAN LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III JAKARTA TAHUN ANGGARAN {$tahun}");
            $sheet->setCellValue('A8', 'DI '.strtoupper($pd->tempat ?? 'JAKARTA')." TANGGAL {$tglPelaksanaan}");
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

        $nomor = str_replace('/', '-', $pd->nomor_permohonan);
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
        $sheet->mergeCells('A9:A10');
        $sheet->setCellValue('A9', 'No');
        $sheet->mergeCells('B9:B10');
        $sheet->setCellValue('B9', 'Nama');
        $sheet->mergeCells('C9:C10');
        $sheet->setCellValue('C9', 'NIK');
        $sheet->mergeCells('D9:D10');
        $sheet->setCellValue('D9', 'NPWP');
        $sheet->mergeCells('E9:E10');
        $sheet->setCellValue('E9', 'Gol');
        $sheet->mergeCells('F9:H9');
        $sheet->setCellValue('F9', 'Honorarium');
        $sheet->setCellValue('F10', 'Jml Keg');
        $sheet->setCellValue('G10', 'Rp/Keg');
        $sheet->setCellValue('H10', 'Jml Bruto');
        $sheet->mergeCells('I9:I10');
        $sheet->setCellValue('I9', 'DPP PNS/Non PNS');
        $sheet->mergeCells('J9:K9');
        $sheet->setCellValue('J9', 'PPh21');
        $sheet->setCellValue('J10', 'Tarif');
        $sheet->setCellValue('K10', 'Jml Pajak');
        $sheet->mergeCells('L9:L10');
        $sheet->setCellValue('L9', 'Jml Diterima');
        $sheet->mergeCells('M9:M10');
        $sheet->setCellValue('M9', 'Atas Nama Rekening');
        $sheet->mergeCells('N9:N10');
        $sheet->setCellValue('N9', 'Nomor Rekening');
        $sheet->mergeCells('O9:O10');
        $sheet->setCellValue('O9', 'Bank');
        $sheet->mergeCells('P9:P10');
        $sheet->setCellValue('P9', 'Email');

        $this->styleHeaderRange($sheet, 'A9:P10');

        // Data rows
        $row = 11;
        $no = 1;
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

            $totalBruto += (float) $nom->jumlah_bruto;
            $totalPajak += (float) $nom->jumlah_pajak;
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
        $sheet->mergeCells('A11:A13');
        $sheet->setCellValue('A11', 'No');
        $sheet->mergeCells('B11:B13');
        $sheet->setCellValue('B11', 'Nama');
        $sheet->mergeCells('C11:C13');
        $sheet->setCellValue('C11', 'Jabatan Dalam Tugas');
        $sheet->mergeCells('D11:D13');
        $sheet->setCellValue('D11', 'NIK');
        $sheet->mergeCells('E11:E13');
        $sheet->setCellValue('E11', 'NPWP');
        $sheet->mergeCells('F11:F13');
        $sheet->setCellValue('F11', 'Gol');
        $sheet->mergeCells('G11:I11');
        $sheet->setCellValue('G11', 'Honorarium');
        $sheet->mergeCells('G12:G13');
        $sheet->setCellValue('G12', 'Jml Keg');
        $sheet->mergeCells('H12:H13');
        $sheet->setCellValue('H12', 'Rp/Keg');
        $sheet->mergeCells('I12:I13');
        $sheet->setCellValue('I12', 'Jml Bruto');
        $sheet->mergeCells('J11:J13');
        $sheet->setCellValue('J11', 'DPP PNS/Non PNS');
        $sheet->mergeCells('K11:L11');
        $sheet->setCellValue('K11', 'PPh21');
        $sheet->mergeCells('K12:K13');
        $sheet->setCellValue('K12', 'Tarif');
        $sheet->mergeCells('L12:L13');
        $sheet->setCellValue('L12', 'Jml Pajak');
        $sheet->mergeCells('M11:M13');
        $sheet->setCellValue('M11', 'Jml Diterima');
        $sheet->mergeCells('N11:N13');
        $sheet->setCellValue('N11', 'Atas Nama Rekening');
        $sheet->mergeCells('O11:O13');
        $sheet->setCellValue('O11', 'Nomor Rekening');
        $sheet->mergeCells('P11:P13');
        $sheet->setCellValue('P11', 'Bank');
        $sheet->mergeCells('Q11:Q13');
        $sheet->setCellValue('Q11', 'Email');

        $this->styleHeaderRange($sheet, 'A11:Q13');

        $row = 14;
        $no = 1;
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

            $totalBruto += (float) $nom->jumlah_bruto;
            $totalPajak += (float) $nom->jumlah_pajak;
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
        $sheet->mergeCells('A11:A13');
        $sheet->setCellValue('A11', 'No');
        $sheet->mergeCells('B11:B13');
        $sheet->setCellValue('B11', 'Nama');
        $sheet->mergeCells('C11:C13');
        $sheet->setCellValue('C11', 'Transport (Rp)');
        $sheet->mergeCells('D11:F11');
        $sheet->setCellValue('D11', 'Uang Harian Biasa');
        $sheet->mergeCells('D12:D13');
        $sheet->setCellValue('D12', 'Jml Hari');
        $sheet->mergeCells('E12:E13');
        $sheet->setCellValue('E12', 'Satuan');
        $sheet->mergeCells('F12:F13');
        $sheet->setCellValue('F12', 'Jumlah');
        $sheet->mergeCells('G11:I11');
        $sheet->setCellValue('G11', 'Uang Harian Fullboard');
        $sheet->mergeCells('G12:G13');
        $sheet->setCellValue('G12', 'Jml Hari');
        $sheet->mergeCells('H12:H13');
        $sheet->setCellValue('H12', 'Satuan');
        $sheet->mergeCells('I12:I13');
        $sheet->setCellValue('I12', 'Jumlah');
        $sheet->mergeCells('J11:L11');
        $sheet->setCellValue('J11', 'Uang Harian Fullday');
        $sheet->mergeCells('J12:J13');
        $sheet->setCellValue('J12', 'Jml Hari');
        $sheet->mergeCells('K12:K13');
        $sheet->setCellValue('K12', 'Satuan');
        $sheet->mergeCells('L12:L13');
        $sheet->setCellValue('L12', 'Jumlah');
        $sheet->mergeCells('M11:M13');
        $sheet->setCellValue('M11', 'Uang Representasi');
        $sheet->mergeCells('N11:N13');
        $sheet->setCellValue('N11', 'Taksi PP');
        $sheet->mergeCells('O11:O13');
        $sheet->setCellValue('O11', 'Tiket Pesawat');
        $sheet->mergeCells('P11:P13');
        $sheet->setCellValue('P11', 'Akomodasi Hotel');
        $sheet->mergeCells('Q11:Q13');
        $sheet->setCellValue('Q11', 'Jml Diterima (Rp)');
        $sheet->mergeCells('R11:R13');
        $sheet->setCellValue('R11', 'Atas Nama Rekening');
        $sheet->mergeCells('S11:S13');
        $sheet->setCellValue('S11', 'Nomor Rekening');
        $sheet->mergeCells('T11:T13');
        $sheet->setCellValue('T11', 'Bank');
        $sheet->mergeCells('U11:U13');
        $sheet->setCellValue('U11', 'Email');

        $this->styleHeaderRange($sheet, 'A11:U13');

        $row = 14;
        $no = 1;
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
        $sheet->setCellValue("A{$r}", 'Terbilang : '.$this->terbilang((int) $total).' Rupiah');
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
        $sheet->setCellValue("A{$r}", 'NIP. '.($ppk?->nip ?? '-'));
        $sheet->setCellValue("{$colBendahara}{$r}", 'NIP. '.($bendahara?->nip ?? '-'));
    }

    // ─── Style helpers ────────────────────────────────────────────────────────

    private function writeHeaders($sheet, int $startRow, array $headerRows, string $lastCol): void
    {
        foreach ($headerRows as $i => $cols) {
            $col = 'A';
            foreach ($cols as $h) {
                $sheet->setCellValue("{$col}".($startRow + $i), $h);
                $col++;
            }
        }
    }

    private function styleHeaderRange($sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => ['bold' => true, 'name' => 'Times New Roman', 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'BDD7EE']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
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

        return $d->format('d').' '.$bulan[(int) $d->format('n')].' '.$d->format('Y');
    }

    // ─── Helper: terbilang ────────────────────────────────────────────────────

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
