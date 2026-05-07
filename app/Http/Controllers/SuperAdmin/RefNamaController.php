<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\RefNama;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;

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
            'nama'               => 'required|string|max:150',
            'nip'                => ['nullable', 'string', 'max:30', Rule::unique('ref_nama', 'nip')->whereNotNull('nip')],
            'nik'                => 'nullable|string|max:20',
            'npwp'               => 'nullable|string|max:20',
            'gol_ruang'          => 'nullable|string|max:10',
            'status_kepegawaian' => ['required', Rule::in(['PNS', 'Non-PNS'])],
            'nama_rekening'      => 'nullable|string|max:150',
            'no_rekening'        => 'nullable|string|max:30',
            'nama_bank'          => 'nullable|string|max:100',
            'email'              => 'nullable|email|max:150',
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
            'nama'               => 'required|string|max:150',
            'nip'                => ['nullable', 'string', 'max:30', Rule::unique('ref_nama', 'nip')->ignore($refNama->id)->whereNotNull('nip')],
            'nik'                => 'nullable|string|max:20',
            'npwp'               => 'nullable|string|max:20',
            'gol_ruang'          => 'nullable|string|max:10',
            'status_kepegawaian' => ['required', Rule::in(['PNS', 'Non-PNS'])],
            'nama_rekening'      => 'nullable|string|max:150',
            'no_rekening'        => 'nullable|string|max:30',
            'nama_bank'          => 'nullable|string|max:100',
            'email'              => 'nullable|email|max:150',
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
        $refNama->update(['is_aktif' => !$refNama->is_aktif]);
        $status = $refNama->is_aktif ? 'diaktifkan' : 'dinonaktifkan';
        return back()->with('success', "Pegawai {$refNama->nama} berhasil {$status}.");
    }

    /**
     * Import pegawai dari Excel.
     * Format: A=Nama, B=NIP, C=NIK, D=NPWP, E=GolRuang, F=Status(PNS/Non-PNS),
     *         G=NamaRekening, H=NoRekening, I=NamaBank, J=Email
     */
    public function importExcel(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:5120',
        ]);

        $spreadsheet = IOFactory::load($request->file('file')->getRealPath());
        $rows        = $spreadsheet->getActiveSheet()->toArray(null, true, true, true);

        $imported = 0;
        foreach ($rows as $rowNum => $row) {
            if ($rowNum <= 1) continue;                // skip header
            if (empty($row['A'])) continue;            // skip baris kosong

            $status = in_array($row['F'] ?? '', ['PNS', 'Non-PNS']) ? $row['F'] : 'PNS';
            $pph    = RefNama::hitungPph21($status, $row['E'] ?? null, $row['D'] ?? null);

            RefNama::updateOrCreate(
                ['nip' => !empty($row['B']) ? trim($row['B']) : null, 'nama' => trim($row['A'])],
                [
                    'nama'               => trim($row['A']),
                    'nip'                => !empty($row['B']) ? trim($row['B']) : null,
                    'nik'                => !empty($row['C']) ? trim($row['C']) : null,
                    'npwp'               => !empty($row['D']) ? trim($row['D']) : null,
                    'gol_ruang'          => !empty($row['E']) ? trim($row['E']) : null,
                    'status_kepegawaian' => $status,
                    'nama_rekening'      => !empty($row['G']) ? trim($row['G']) : null,
                    'no_rekening'        => !empty($row['H']) ? trim($row['H']) : null,
                    'nama_bank'          => !empty($row['I']) ? trim($row['I']) : null,
                    'email'              => !empty($row['J']) ? trim($row['J']) : null,
                    'pph21_persen'       => $pph,
                    'is_aktif'           => true,
                ]
            );
            $imported++;
        }

        return back()->with('success', "Import selesai. {$imported} pegawai diproses.");
    }
}
