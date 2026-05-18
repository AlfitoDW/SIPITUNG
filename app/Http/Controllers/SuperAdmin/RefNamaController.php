<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\RefNama;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response as ResponseFacade;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class RefNamaController extends Controller
{
    public function index(): Response
    {
        $pegawai = RefNama::orderBy('nama')->get();

        return Inertia::render('SuperAdmin/RefNama/Index', [
            'pegawai' => $pegawai,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:150',
            'nip' => ['nullable', 'string', 'max:30', Rule::unique('ref_nama', 'nip')->whereNotNull('nip')],
            'nik' => 'nullable|string|max:20',
            'npwp' => 'nullable|string|max:20',
            'gol_ruang' => 'nullable|string|max:10',
            'status_kepegawaian' => ['required', Rule::in(['PNS', 'Non-PNS'])],
            'nama_rekening' => 'nullable|string|max:150',
            'no_rekening' => 'nullable|string|max:30',
            'nama_bank' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
        ]);

        $validated['pph21_persen'] = RefNama::hitungPph21(
            $validated['status_kepegawaian'],
            $validated['gol_ruang'] ?? null,
            $validated['npwp'] ?? null,
        );

        RefNama::create($validated);

        return back()->with('success', 'Data pegawai berhasil ditambahkan.');
    }

    public function update(Request $request, RefNama $refNama): RedirectResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:150',
            'nip' => ['nullable', 'string', 'max:30', Rule::unique('ref_nama', 'nip')->ignore($refNama->id)->whereNotNull('nip')],
            'nik' => 'nullable|string|max:20',
            'npwp' => 'nullable|string|max:20',
            'gol_ruang' => 'nullable|string|max:10',
            'status_kepegawaian' => ['required', Rule::in(['PNS', 'Non-PNS'])],
            'nama_rekening' => 'nullable|string|max:150',
            'no_rekening' => 'nullable|string|max:30',
            'nama_bank' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:150',
        ]);

        $validated['pph21_persen'] = RefNama::hitungPph21(
            $validated['status_kepegawaian'],
            $validated['gol_ruang'] ?? null,
            $validated['npwp'] ?? null,
        );

        $refNama->update($validated);

        return back()->with('success', 'Data pegawai berhasil diperbarui.');
    }

    public function destroy(RefNama $refNama): RedirectResponse
    {
        $refNama->delete();

        return back()->with('success', 'Data pegawai dihapus.');
    }

    public function toggleStatus(RefNama $refNama): RedirectResponse
    {
        $refNama->update(['is_aktif' => ! $refNama->is_aktif]);
        $status = $refNama->is_aktif ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Pegawai {$refNama->nama} berhasil {$status}.");
    }

    /**
     * Download template Excel kosong untuk import pegawai.
     */
    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();

        // Header row
        $headers = ['nama', 'nip', 'nik', 'npwp', 'gol_ruang', 'status_kepegawaian', 'nama_rekening', 'no_rekening', 'nama_bank', 'email'];
        foreach ($headers as $idx => $header) {
            $col = chr(65 + $idx); // A, B, C, ...
            $sheet->setCellValue($col.'1', $header);
            $sheet->getStyle($col.'1')->getFont()->setBold(true);
            $sheet->getStyle($col.'1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E2E8F0');
        }

        // Sample data rows (contoh, user bisa hapus)
        $samples = [
            ['Budi Santoso', '198501012010011001', '3273010101850001', '123456789012345', 'III/a', 'PNS', 'Budi Santoso', '0012345678', 'BNI', 'budi@contoh.com'],
            ['Ani Wijaya', '-', '3273010202860002', '', '', 'Non-PNS', 'Ani Wijaya', '0087654321', 'BRI', 'ani@contoh.com'],
            ['Citra Lestari', '197803152003122002', '3273011503780003', '987654321098765', 'IV/b', 'PNS', 'Citra Lestari', '0022334455', 'Mandiri', 'citra@contoh.com'],
        ];
        foreach ($samples as $r => $row) {
            foreach ($row as $c => $val) {
                $sheet->setCellValue(chr(65 + $c).($r + 2), $val);
            }
        }

        // Dropdown validation for status_kepegawaian (column F)
        $statusValidation = new DataValidation;
        $statusValidation->setType(DataValidation::TYPE_LIST);
        $statusValidation->setErrorStyle(DataValidation::STYLE_STOP);
        $statusValidation->setAllowBlank(true);
        $statusValidation->setShowDropDown(true);
        $statusValidation->setFormula1('"PNS,Non-PNS"');
        for ($row = 2; $row <= 1000; $row++) {
            $sheet->getCell('F'.$row)->setDataValidation($statusValidation);
        }

        // Dropdown validation for gol_ruang (column E)
        $golOptions = ['I/a', 'I/b', 'I/c', 'I/d', 'II/a', 'II/b', 'II/c', 'II/d', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'];
        $golValidation = new DataValidation;
        $golValidation->setType(DataValidation::TYPE_LIST);
        $golValidation->setErrorStyle(DataValidation::STYLE_STOP);
        $golValidation->setAllowBlank(true);
        $golValidation->setShowDropDown(true);
        $golValidation->setFormula1('"'.implode(',', $golOptions).'"');
        for ($row = 2; $row <= 1000; $row++) {
            $sheet->getCell('E'.$row)->setDataValidation($golValidation);
        }

        // Column widths
        foreach (range('A', 'J') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'template-import-pegawai.xlsx';
        $writer = new Xlsx($spreadsheet);
        ob_start();
        $writer->save('php://output');
        $content = ob_get_clean();

        return ResponseFacade::make($content, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Import pegawai dari Excel template.
     * Wajib pakai header: nama, nip, nik, npwp, gol_ruang, status_kepegawaian, nama_rekening, no_rekening, nama_bank, email
     */
    public function importExcel(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:5120',
        ]);

        $spreadsheet = IOFactory::load($request->file('file')->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);

        if (count($rows) < 1) {
            return back()->with('error', 'File Excel kosong.');
        }

        // Validasi header
        $expected = ['nama', 'nip', 'nik', 'npwp', 'gol_ruang', 'status_kepegawaian', 'nama_rekening', 'no_rekening', 'nama_bank', 'email'];
        $actual = array_values(array_map(fn ($v) => strtolower(trim((string) $v)), array_slice($rows[1], 0, 10)));
        if ($actual !== $expected) {
            return back()->with('error', 'Format file tidak sesuai template. Pastikan baris pertama berisi header: '.implode(', ', $expected).'. Silakan download template dan isi ulang.');
        }

        $imported = 0;
        $updated = 0;
        $skipped = 0;
        $errorDetails = [];

        foreach ($rows as $rowNum => $row) {
            if ($rowNum <= 1) {
                continue;
            } // skip header
            if (empty($row['A']) || trim((string) $row['A']) === '') {
                continue;
            } // skip baris kosong

            $nama = trim((string) $row['A']);
            $nip = $this->nullableString($row['B']);
            $nik = $this->nullableString($row['C']);
            $npwp = $this->nullableString($row['D']);
            $golRuang = $this->nullableString($row['E']);
            $statusRaw = trim((string) ($row['F'] ?? ''));
            $status = in_array($statusRaw, ['PNS', 'Non-PNS']) ? $statusRaw : 'PNS';
            $namaRekening = $this->nullableString($row['G']);
            $noRekening = $this->nullableString($row['H']);
            $namaBank = $this->nullableString($row['I']);
            $email = $this->nullableString($row['J']);

            $pph = RefNama::hitungPph21($status, $golRuang, $npwp);

            try {
                // Cari existing berdasarkan NIP (unik). Kalau NIP kosong, pakai nama.
                $existing = null;
                if (! empty($nip)) {
                    $existing = RefNama::where('nip', $nip)->first();
                } else {
                    $existing = RefNama::whereNull('nip')->where('nama', $nama)->first();
                }

                $data = [
                    'nama' => $nama,
                    'nip' => $nip,
                    'nik' => $nik,
                    'npwp' => $npwp,
                    'gol_ruang' => $golRuang,
                    'status_kepegawaian' => $status,
                    'nama_rekening' => $namaRekening,
                    'no_rekening' => $noRekening,
                    'nama_bank' => $namaBank,
                    'email' => $email,
                    'pph21_persen' => $pph,
                    'is_aktif' => true,
                ];

                if ($existing) {
                    $existing->update($data);
                    $updated++;
                } else {
                    RefNama::create($data);
                    $imported++;
                }
            } catch (\Exception $e) {
                $skipped++;
                $errorDetails[] = "Baris {$rowNum} ({$nama}): ".$e->getMessage();
            }
        }

        $msg = "Import selesai. {$imported} ditambah, {$updated} diperbarui.";
        if ($skipped > 0) {
            $msg .= " {$skipped} baris dilewati karena error.";
        }

        $flash = back()->with('success', $msg);
        if (! empty($errorDetails)) {
            $flash->with('importErrors', array_slice($errorDetails, 0, 10));
        }

        return $flash;
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null || $value === '' || $value === '-') {
            return null;
        }
        $str = trim((string) $value);

        return $str === '' || $str === '-' ? null : $str;
    }
}
