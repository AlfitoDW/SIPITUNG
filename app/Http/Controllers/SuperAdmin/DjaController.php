<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\DjaKegiatan;
use App\Models\DjaKomponen;
use App\Models\DjaKro;
use App\Models\DjaProgram;
use App\Models\DjaRincianBiaya;
use App\Models\DjaRo;
use App\Models\DjaSasaran;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\IOFactory;

class DjaController extends Controller
{
    // ─── Index ────────────────────────────────────────────────────────────────────

    public function index(): Response
    {
        $tahun = TahunAnggaran::forSession();

        $programs = DjaProgram::where('tahun_anggaran', $tahun->tahun)
            ->orderBy('kode')
            ->get(['id', 'kode', 'nama', 'pagu', 'is_aktif']);

        $sasarans = DjaSasaran::with('program:id,kode,nama')
            ->whereHas('program', fn ($q) => $q->where('tahun_anggaran', $tahun->tahun))
            ->orderBy('kode')
            ->get(['id', 'program_id', 'kode', 'nama', 'pagu', 'is_aktif']);

        $kros = DjaKro::with('sasaran:id,kode,nama')
            ->whereHas('sasaran.program', fn ($q) => $q->where('tahun_anggaran', $tahun->tahun))
            ->orderBy('kode')
            ->get(['id', 'sasaran_id', 'kode', 'nama', 'pagu', 'is_aktif']);

        $ros = DjaRo::with('kro:id,kode,nama')
            ->whereHas('kro.sasaran.program', fn ($q) => $q->where('tahun_anggaran', $tahun->tahun))
            ->orderBy('kode')
            ->get(['id', 'kro_id', 'kode', 'nama', 'pagu', 'is_aktif']);

        $komponens = DjaKomponen::with('ro:id,kode,nama')
            ->whereHas('ro.kro.sasaran.program', fn ($q) => $q->where('tahun_anggaran', $tahun->tahun))
            ->orderBy('kode')
            ->get(['id', 'ro_id', 'kode', 'nama', 'jenis', 'pagu', 'is_aktif']);

        $kegiatans = DjaKegiatan::with('komponen:id,kode,nama')
            ->whereHas('komponen.ro.kro.sasaran.program', fn ($q) => $q->where('tahun_anggaran', $tahun->tahun))
            ->orderBy('kode')
            ->get(['id', 'komponen_id', 'kode', 'nama', 'pagu', 'is_aktif']);

        $rincians = DjaRincianBiaya::with('kegiatan:id,kode,nama')
            ->whereHas('kegiatan.komponen.ro.kro.sasaran.program', fn ($q) => $q->where('tahun_anggaran', $tahun->tahun))
            ->orderBy('kode_akun')
            ->orderBy('urutan')
            ->get();

        return Inertia::render('SuperAdmin/Keuangan/MasterAnggaran/Index', [
            'tahun' => $tahun,
            'programs' => $programs,
            'sasarans' => $sasarans,
            'kros' => $kros,
            'ros' => $ros,
            'komponens' => $komponens,
            'kegiatans' => $kegiatans,
            'rincians' => $rincians,
        ]);
    }

    // ─── Program CRUD ─────────────────────────────────────────────────────────────

    public function programStore(Request $request): RedirectResponse
    {
        $tahun = TahunAnggaran::forSession();
        $request->validate([
            'kode' => ['required', 'string', 'max:20', Rule::unique('dja_program', 'kode')],
            'nama' => 'required|string|max:250',
            'pagu' => 'required|integer|min:0',
        ]);
        DjaProgram::create([
            'tahun_anggaran' => $tahun->tahun,
            'kode' => $request->kode,
            'nama' => $request->nama,
            'pagu' => $request->pagu,
            'is_aktif' => true,
        ]);

        return back()->with('success', 'Program berhasil ditambahkan.');
    }

    public function programUpdate(Request $request, DjaProgram $program): RedirectResponse
    {
        $request->validate([
            'kode' => ['required', 'string', 'max:20', Rule::unique('dja_program', 'kode')->ignore($program->id)],
            'nama' => 'required|string|max:250',
            'pagu' => 'required|integer|min:0',
        ]);
        $program->update($request->only('kode', 'nama', 'pagu'));

        return back()->with('success', 'Program berhasil diperbarui.');
    }

    public function programToggle(DjaProgram $program): RedirectResponse
    {
        $program->update(['is_aktif' => ! $program->is_aktif]);

        return back()->with('success', 'Status program diperbarui.');
    }

    public function programDestroy(DjaProgram $program): RedirectResponse
    {
        $program->delete();

        return back()->with('success', 'Program dihapus.');
    }

    // ─── Sasaran CRUD ─────────────────────────────────────────────────────────────

    public function sasaranStore(Request $request): RedirectResponse
    {
        $request->validate([
            'program_id' => 'required|exists:dja_program,id',
            'kode' => 'required|string|max:10',
            'nama' => 'required|string|max:300',
            'pagu' => 'required|integer|min:0',
        ]);
        DjaSasaran::create($request->only('program_id', 'kode', 'nama', 'pagu') + ['is_aktif' => true]);

        return back()->with('success', 'Sasaran berhasil ditambahkan.');
    }

    public function sasaranUpdate(Request $request, DjaSasaran $sasaran): RedirectResponse
    {
        $request->validate([
            'kode' => 'required|string|max:10',
            'nama' => 'required|string|max:300',
            'pagu' => 'required|integer|min:0',
        ]);
        $sasaran->update($request->only('kode', 'nama', 'pagu'));

        return back()->with('success', 'Sasaran berhasil diperbarui.');
    }

    public function sasaranToggle(DjaSasaran $sasaran): RedirectResponse
    {
        $sasaran->update(['is_aktif' => ! $sasaran->is_aktif]);

        return back()->with('success', 'Status sasaran diperbarui.');
    }

    public function sasaranDestroy(DjaSasaran $sasaran): RedirectResponse
    {
        $sasaran->delete();

        return back()->with('success', 'Sasaran dihapus.');
    }

    // ─── KRO CRUD ─────────────────────────────────────────────────────────────────

    public function kroStore(Request $request): RedirectResponse
    {
        $request->validate([
            'sasaran_id' => 'required|exists:dja_sasaran,id',
            'kode' => 'required|string|max:15',
            'nama' => 'required|string|max:300',
            'pagu' => 'required|integer|min:0',
        ]);
        DjaKro::create($request->only('sasaran_id', 'kode', 'nama', 'pagu') + ['is_aktif' => true]);

        return back()->with('success', 'KRO berhasil ditambahkan.');
    }

    public function kroUpdate(Request $request, DjaKro $kro): RedirectResponse
    {
        $request->validate([
            'kode' => 'required|string|max:15',
            'nama' => 'required|string|max:300',
            'pagu' => 'required|integer|min:0',
        ]);
        $kro->update($request->only('kode', 'nama', 'pagu'));

        return back()->with('success', 'KRO berhasil diperbarui.');
    }

    public function kroToggle(DjaKro $kro): RedirectResponse
    {
        $kro->update(['is_aktif' => ! $kro->is_aktif]);

        return back()->with('success', 'Status KRO diperbarui.');
    }

    public function kroDestroy(DjaKro $kro): RedirectResponse
    {
        $kro->delete();

        return back()->with('success', 'KRO dihapus.');
    }

    // ─── RO CRUD ──────────────────────────────────────────────────────────────────

    public function roStore(Request $request): RedirectResponse
    {
        $request->validate([
            'kro_id' => 'required|exists:dja_kro,id',
            'kode' => 'required|string|max:20',
            'nama' => 'required|string|max:400',
            'pagu' => 'required|integer|min:0',
        ]);
        DjaRo::create($request->only('kro_id', 'kode', 'nama', 'pagu') + ['is_aktif' => true]);

        return back()->with('success', 'RO berhasil ditambahkan.');
    }

    public function roUpdate(Request $request, DjaRo $ro): RedirectResponse
    {
        $request->validate([
            'kode' => 'required|string|max:20',
            'nama' => 'required|string|max:400',
            'pagu' => 'required|integer|min:0',
        ]);
        $ro->update($request->only('kode', 'nama', 'pagu'));

        return back()->with('success', 'RO berhasil diperbarui.');
    }

    public function roToggle(DjaRo $ro): RedirectResponse
    {
        $ro->update(['is_aktif' => ! $ro->is_aktif]);

        return back()->with('success', 'Status RO diperbarui.');
    }

    public function roDestroy(DjaRo $ro): RedirectResponse
    {
        $ro->delete();

        return back()->with('success', 'RO dihapus.');
    }

    // ─── Komponen CRUD ────────────────────────────────────────────────────────────

    public function komponenStore(Request $request): RedirectResponse
    {
        $request->validate([
            'ro_id' => 'required|exists:dja_ro,id',
            'kode' => 'required|string|max:10',
            'nama' => 'required|string|max:300',
            'jenis' => ['required', Rule::in(['Utama', 'Pendukung'])],
            'pagu' => 'required|integer|min:0',
        ]);
        DjaKomponen::create($request->only('ro_id', 'kode', 'nama', 'jenis', 'pagu') + ['is_aktif' => true]);

        return back()->with('success', 'Komponen berhasil ditambahkan.');
    }

    public function komponenUpdate(Request $request, DjaKomponen $komponen): RedirectResponse
    {
        $request->validate([
            'kode' => 'required|string|max:10',
            'nama' => 'required|string|max:300',
            'jenis' => ['required', Rule::in(['Utama', 'Pendukung'])],
            'pagu' => 'required|integer|min:0',
        ]);
        $komponen->update($request->only('kode', 'nama', 'jenis', 'pagu'));

        return back()->with('success', 'Komponen berhasil diperbarui.');
    }

    public function komponenToggle(DjaKomponen $komponen): RedirectResponse
    {
        $komponen->update(['is_aktif' => ! $komponen->is_aktif]);

        return back()->with('success', 'Status komponen diperbarui.');
    }

    public function komponenDestroy(DjaKomponen $komponen): RedirectResponse
    {
        $komponen->delete();

        return back()->with('success', 'Komponen dihapus.');
    }

    // ─── Kegiatan CRUD ────────────────────────────────────────────────────────────

    public function kegiatanStore(Request $request): RedirectResponse
    {
        $request->validate([
            'komponen_id' => 'required|exists:dja_komponen,id',
            'kode' => 'required|string|max:5',
            'nama' => 'required|string|max:400',
            'pagu' => 'required|integer|min:0',
        ]);
        DjaKegiatan::create($request->only('komponen_id', 'kode', 'nama', 'pagu') + ['is_aktif' => true]);

        return back()->with('success', 'Kegiatan berhasil ditambahkan.');
    }

    public function kegiatanUpdate(Request $request, DjaKegiatan $kegiatan): RedirectResponse
    {
        $request->validate([
            'kode' => 'required|string|max:5',
            'nama' => 'required|string|max:400',
            'pagu' => 'required|integer|min:0',
        ]);
        $kegiatan->update($request->only('kode', 'nama', 'pagu'));

        return back()->with('success', 'Kegiatan berhasil diperbarui.');
    }

    public function kegiatanToggle(DjaKegiatan $kegiatan): RedirectResponse
    {
        $kegiatan->update(['is_aktif' => ! $kegiatan->is_aktif]);

        return back()->with('success', 'Status kegiatan diperbarui.');
    }

    public function kegiatanDestroy(DjaKegiatan $kegiatan): RedirectResponse
    {
        $kegiatan->delete();

        return back()->with('success', 'Kegiatan dihapus.');
    }

    // ─── Rincian Biaya CRUD ───────────────────────────────────────────────────────

    public function rincianStore(Request $request): RedirectResponse
    {
        $request->validate([
            'kegiatan_id' => 'required|exists:dja_kegiatan,id',
            'kode_akun' => 'required|string|max:10',
            'nama_akun' => 'required|string|max:150',
            'nama_item' => 'required|string|max:300',
            'satuan' => 'required|string|max:20',
            'harga_satuan' => 'required|integer|min:0',
            'pagu_total' => 'required|integer|min:0',
            'urutan' => 'nullable|integer|min:0',
        ]);
        DjaRincianBiaya::create($request->only(
            'kegiatan_id', 'kode_akun', 'nama_akun', 'nama_item',
            'satuan', 'harga_satuan', 'pagu_total', 'urutan'
        ) + ['is_aktif' => true]);

        return back()->with('success', 'Rincian biaya berhasil ditambahkan.');
    }

    public function rincianUpdate(Request $request, DjaRincianBiaya $rincian): RedirectResponse
    {
        $request->validate([
            'kode_akun' => 'required|string|max:10',
            'nama_akun' => 'required|string|max:150',
            'nama_item' => 'required|string|max:300',
            'satuan' => 'required|string|max:20',
            'harga_satuan' => 'required|integer|min:0',
            'pagu_total' => 'required|integer|min:0',
            'urutan' => 'nullable|integer|min:0',
        ]);
        $rincian->update($request->only(
            'kode_akun', 'nama_akun', 'nama_item',
            'satuan', 'harga_satuan', 'pagu_total', 'urutan'
        ));

        return back()->with('success', 'Rincian biaya berhasil diperbarui.');
    }

    public function rincianToggle(DjaRincianBiaya $rincian): RedirectResponse
    {
        $rincian->update(['is_aktif' => ! $rincian->is_aktif]);

        return back()->with('success', 'Status rincian diperbarui.');
    }

    public function rincianDestroy(DjaRincianBiaya $rincian): RedirectResponse
    {
        $rincian->delete();

        return back()->with('success', 'Rincian biaya dihapus.');
    }

    // ─── Import Excel DJA ─────────────────────────────────────────────────────────

    /**
     * Import hierarki DJA dari file Excel.
     *
     * Format sheet yang diharapkan:
     * Kolom A=Kode Program, B=Nama Program, C=Pagu Program
     *       D=Kode Sasaran, E=Nama Sasaran, F=Pagu Sasaran
     *       G=Kode KRO,    H=Nama KRO,    I=Pagu KRO
     *       J=Kode RO,     K=Nama RO,     L=Pagu RO
     *       M=Kode Komp,   N=Nama Komp,   O=Jenis Komp, P=Pagu Komp
     *       Q=Kode Keg,    R=Nama Keg,    S=Pagu Keg
     *       T=Kode Akun,   U=Nama Akun,   V=Nama Item, W=Satuan, X=Harga, Y=Pagu Item, Z=Urutan
     *
     * Data sheet yang lebih sederhana (terserah mapping-nya per baris).
     * Implementasi ini membaca baris per baris dan upsert tiap level.
     */
    public function importExcel(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:10240',
        ]);

        $tahun = TahunAnggaran::forSession();

        $spreadsheet = IOFactory::load($request->file('file')->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true); // keyed by column letter

        // ── State tracker (hierarki vertikal) ────────────────────────────────
        $currentProgram = null;
        $currentSasaran = null;
        $currentKro = null;
        $currentRo = null;
        $currentKomponen = null;
        $currentKegiatan = null;
        $currentKodeAkun = null;
        $currentNamaAkun = null;
        $urutan = 0;
        $imported = 0;

        $paguInt = fn ($v) => (int) preg_replace('/[^\d]/', '', (string) ($v ?? 0));

        foreach ($rows as $rowNum => $row) {
            $a = trim((string) ($row['A'] ?? ''));
            $b = trim((string) ($row['B'] ?? ''));
            $c = trim((string) ($row['C'] ?? ''));
            $d = trim((string) ($row['D'] ?? ''));
            $e = trim((string) ($row['E'] ?? ''));
            $f = trim((string) ($row['F'] ?? ''));

            if ($a === '' && $b === '') {
                continue;
            } // baris kosong

            // ── Program  e.g. "139.03.DK" ────────────────────────────────────
            if (preg_match('/^\d{3}\.\d{2}\.[A-Z]{2,3}$/', $a)) {
                $currentProgram = DjaProgram::updateOrCreate(
                    ['kode' => $a, 'tahun_anggaran' => $tahun->tahun],
                    ['nama' => $b, 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentSasaran = $currentKro = $currentRo = $currentKomponen = $currentKegiatan = null;
                $imported++;

                continue;
            }

            // ── Sasaran  e.g. "4472" (4-digit) ──────────────────────────────
            if (preg_match('/^\d{4}$/', $a) && $currentProgram) {
                $currentSasaran = DjaSasaran::updateOrCreate(
                    ['program_id' => $currentProgram->id, 'kode' => $a],
                    ['nama' => $b, 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentKro = $currentRo = $currentKomponen = $currentKegiatan = null;
                $imported++;

                continue;
            }

            // ── KRO  e.g. "4472.BDB" ─────────────────────────────────────────
            if (preg_match('/^\d{4}\.[A-Z]{3}$/', $a) && $currentSasaran) {
                $currentKro = DjaKro::updateOrCreate(
                    ['sasaran_id' => $currentSasaran->id, 'kode' => $a],
                    ['nama' => $b, 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentRo = $currentKomponen = $currentKegiatan = null;
                $imported++;

                continue;
            }

            // ── RO  e.g. "4472.BDB.001" ──────────────────────────────────────
            if (preg_match('/^\d{4}\.[A-Z]{3}\.\d{3}$/', $a) && $currentKro) {
                $currentRo = DjaRo::updateOrCreate(
                    ['kro_id' => $currentKro->id, 'kode' => $a],
                    ['nama' => $b, 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentKomponen = $currentKegiatan = null;
                $imported++;

                continue;
            }

            // ── Komponen  e.g. "051" (3-digit) ───────────────────────────────
            if (preg_match('/^\d{3}$/', $a) && $currentRo) {
                $currentKomponen = DjaKomponen::updateOrCreate(
                    ['ro_id' => $currentRo->id, 'kode' => $a],
                    ['nama' => $b, 'jenis' => 'Utama', 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentKegiatan = null;
                $imported++;

                continue;
            }

            // ── Kegiatan  e.g. "A", "B" (single uppercase letter) ────────────
            if (preg_match('/^[A-Z]$/', $a) && $currentKomponen) {
                $currentKegiatan = DjaKegiatan::updateOrCreate(
                    ['komponen_id' => $currentKomponen->id, 'kode' => $a],
                    ['nama' => $b, 'pagu' => $paguInt($f), 'is_aktif' => true]
                );
                $currentKodeAkun = $currentNamaAkun = null;
                $urutan = 0;
                $imported++;

                continue;
            }

            // ── Kode Akun  e.g. "521211" (6-digit) ───────────────────────────
            if (preg_match('/^\d{6}$/', $a)) {
                $currentKodeAkun = $a;
                $currentNamaAkun = $b;
                $urutan = 0;

                continue;
            }

            // ── Rincian Biaya  (A kosong, B adalah nama item "- 01 ...") ──────
            if ($a === '' && $b !== '' && $currentKegiatan && $currentKodeAkun) {
                $urutan++;
                DjaRincianBiaya::updateOrCreate(
                    ['kegiatan_id' => $currentKegiatan->id, 'nama_item' => $b],
                    [
                        'kode_akun' => $currentKodeAkun,
                        'nama_akun' => $currentNamaAkun ?? '',
                        'volume_default' => is_numeric(str_replace(['.', ','], ['', '.'], $c)) ? (float) str_replace(['.', ','], ['', '.'], $c) : 0,
                        'satuan' => $d ?: 'OK',
                        'harga_satuan' => $paguInt($e),
                        'pagu_total' => $paguInt($f),
                        'urutan' => $urutan,
                        'is_aktif' => true,
                    ]
                );
                $imported++;
            }
        }

        return back()->with('success', "Import selesai. {$imported} baris diproses.");
    }
}
