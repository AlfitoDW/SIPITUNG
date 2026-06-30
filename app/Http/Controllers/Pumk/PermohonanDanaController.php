<?php

namespace App\Http\Controllers\Pumk;

use App\Exports\PermohonanDanaExport;
use App\Http\Controllers\Controller;
use App\Models\DjaKegiatan;
use App\Models\DjaKomponen;
use App\Models\DjaKro;
use App\Models\DjaProgram;
use App\Models\DjaRincianBiaya;
use App\Models\DjaRo;
use App\Models\DjaSasaran;
use App\Models\DjaSubKegiatan;
use App\Models\PermohonanDana;
use App\Models\PermohonanDanaDokumen;
use App\Models\PermohonanDanaItem;
use App\Models\PermohonanDanaItemNominatif;
use App\Models\RefNama;
use App\Models\TahunAnggaran;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PermohonanDanaController extends Controller
{
    // ─── Index ────────────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();

        $permohonan = PermohonanDana::with([
            'items', 'dokumens',
        ])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('created_by', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($pd) => array_merge($pd->toArray(), [
                'status_label' => $pd->status_label,
                // timestamps
                'submitted_at' => $pd->submitted_at?->toIso8601String(),
                'katim_approved_at' => $pd->katim_approved_at?->toIso8601String(),
                'kabag_approved_at' => $pd->kabag_approved_at?->toIso8601String(),
                'ppk_approved_at' => $pd->ppk_approved_at?->toIso8601String(),
                'pic_approved_at' => $pd->pic_approved_at?->toIso8601String(),
                'dicairkan_at' => $pd->dicairkan_at?->toIso8601String(),
                'rejected_at' => $pd->rejected_at?->toIso8601String(),
                'bukti_bayar_uploaded_at' => $pd->bukti_bayar_uploaded_at?->toIso8601String(),
                'lpj_file_path' => $pd->lpj_file_path,
                'lpj_file_name' => $pd->lpj_file_name,
                'lpj_uploaded_at' => $pd->lpj_uploaded_at?->toIso8601String(),
                'lpj_uploaded_by_name' => $pd->lpj_uploaded_by_name,
                // actor names — snapshot only, no fallback live
                'created_by_name' => $pd->created_by_name,
                'katim_approved_by_name' => $pd->katim_approved_by_name,
                'kabag_approved_by_name' => $pd->kabag_approved_by_name,
                'ppk_approved_by_name' => $pd->ppk_approved_by_name,
                'pic_approved_by_name' => $pd->pic_approved_by_name,
                'dicairkan_by_name' => $pd->dicairkan_by_name,
                // kapokja / pic — snapshot only
                'kapokja_name' => $pd->kapokja_name,
                'pic_keuangan_name' => $pd->pic_keuangan_name,
                'next_approver_role' => match ($pd->status) {
                    'submitted' => 'KA.TIM',
                    'katim_approved' => 'PIC Keuangan',
                    'pic_approved' => 'PPK',
                    'ppk_approved' => 'Bendahara',
                    default => null,
                },
                'next_approver_name' => match ($pd->status) {
                    'submitted' => $pd->kapokja_name,
                    'katim_approved' => $pd->pic_keuangan_name,
                    'pic_approved' => \App\Models\User::where('role', 'pimpinan')->where('pimpinan_type', 'ppk')->where('is_active', true)->value('nama_lengkap'),
                    'ppk_approved' => \App\Models\User::where('role', 'bendahara')->where('is_active', true)->value('nama_lengkap'),
                    default => null,
                },
            ]));

        return Inertia::render('Pumk/PermohonanDana/Index', [
            'tahun' => $tahun,
            'permohonan' => $permohonan,
        ]);
    }

    // ─── Create (Form Awal) ───────────────────────────────────────────────────────

    public function create(): Response
    {
        $tahun = TahunAnggaran::forSession();

        // Kirim semua data DJA sekaligus — filter di client side
        $programs = DjaProgram::where('tahun_anggaran', $tahun->tahun)
            ->where('is_aktif', true)->orderBy('kode')
            ->get(['id', 'kode', 'nama', 'pagu']);

        $sasarans = DjaSasaran::where('is_aktif', true)->orderBy('kode')
            ->get(['id', 'program_id', 'kode', 'nama', 'pagu']);

        $kros = DjaKro::where('is_aktif', true)->orderBy('kode')
            ->get(['id', 'sasaran_id', 'kode', 'nama', 'pagu']);

        $ros = DjaRo::where('is_aktif', true)->orderBy('kode')
            ->get(['id', 'kro_id', 'kode', 'nama', 'pagu']);

        $komponens = DjaKomponen::where('is_aktif', true)->orderBy('kode')
            ->get(['id', 'ro_id', 'kode', 'nama', 'pagu']);

        $kegiatans = DjaKegiatan::where('is_aktif', true)->orderBy('kode')
            ->get(['id', 'komponen_id', 'kode', 'nama', 'pagu']);

        return Inertia::render('Pumk/PermohonanDana/Create', [
            'tahun' => $tahun,
            'programs' => $programs,
            'sasarans' => $sasarans,
            'kros' => $kros,
            'ros' => $ros,
            'komponens' => $komponens,
            'kegiatans' => $kegiatans,
        ]);
    }

    // ─── Store (Simpan Draft dari Form Awal) ─────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'dja_program_id' => 'required|exists:dja_program,id',
            'dja_sasaran_id' => 'required|exists:dja_sasaran,id',
            'dja_kro_id' => 'required|exists:dja_kro,id',
            'dja_ro_id' => 'required|exists:dja_ro,id',
            'dja_komponen_id' => 'required|exists:dja_komponen,id',
            'dja_kegiatan_id' => 'required|exists:dja_kegiatan,id',
            'judul_pekerjaan' => 'required|string|max:300',
        ]);

        $tahun = TahunAnggaran::forSession();
        $nomor = PermohonanDana::generateNomor($tahun->id, $tahun->tahun);

        $timKerja = \App\Models\TimKerja::find($request->user()->tim_kerja_id);

        // Load DJA data untuk snapshot
        $program = \App\Models\DjaProgram::find($validated['dja_program_id']);
        $sasaran = \App\Models\DjaSasaran::find($validated['dja_sasaran_id']);
        $kro = \App\Models\DjaKro::find($validated['dja_kro_id']);
        $ro = \App\Models\DjaRo::find($validated['dja_ro_id']);
        $komponen = \App\Models\DjaKomponen::find($validated['dja_komponen_id']);
        $kegiatan = \App\Models\DjaKegiatan::find($validated['dja_kegiatan_id']);

        $pd = PermohonanDana::create(array_merge($validated, [
            'tahun_anggaran_id' => $tahun->id,
            'tim_kerja_id' => $request->user()->tim_kerja_id,
            'nomor_permohonan' => $nomor,
            'keperluan' => $validated['judul_pekerjaan'],
            'status' => 'draft',
            'wizard_step' => 1,
            'created_by' => $request->user()->id,
            'tim_kerja_nama' => $timKerja?->nama,
            'tim_kerja_kode' => $timKerja?->kode,
            'tim_kerja_ketua_name' => $timKerja?->ketua?->nama_lengkap,
            'tim_kerja_ketua_nip' => $timKerja?->ketua?->nip,
            'dja_program_nama' => $program?->nama,
            'dja_sasaran_nama' => $sasaran?->nama,
            'dja_kro_nama' => $kro?->nama,
            'dja_kro_kode' => $kro?->kode,
            'dja_ro_nama' => $ro?->nama,
            'dja_komponen_nama' => $komponen?->nama,
            'dja_kegiatan_nama' => $kegiatan?->nama,
            'dja_kegiatan_kode' => $kegiatan?->kode,
        ]));

        return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
            ->with('success', "Draft {$nomor} berhasil dibuat.");
    }

    // ─── Wizard View (Step 1–4) ───────────────────────────────────────────────────

    public function wizard(Request $request, PermohonanDana $pd): Response
    {
        abort_if($pd->created_by !== $request->user()->id, 403);

        $pd->load([
            'items.djaRincianBiaya.subKegiatan', 'items.nominatif', 'dokumens',
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan',
        ]);

        $refNama = RefNama::aktif()
            ->orderBy('nama')
            ->get(['id', 'nama', 'nip', 'nik', 'npwp', 'gol_ruang', 'status_kepegawaian',
                'nama_rekening', 'no_rekening', 'nama_bank', 'email', 'pph21_persen'])
            ->each(function (RefNama $r) {
                $r->pph21_persen = RefNama::hitungPph21(
                    $r->status_kepegawaian,
                    $r->gol_ruang,
                    $r->npwp
                );
            });

        // Kapokja: hanya Ketua Tim Kerja yang aktif
        $kapokjaList = User::with('timkerja:id,kode,nama')
            ->where('role', 'ketua_tim_kerja')
            ->where('is_active', true)
            ->orderBy('nama_lengkap')
            ->get(['id', 'nama_lengkap', 'role', 'tim_kerja_id'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'nama_lengkap' => $u->nama_lengkap,
                'role' => $u->role,
                'role_label' => $u->role_name,
                'tim_kerja_kode' => $u->timkerja?->kode,
                'tim_kerja_nama' => $u->timkerja?->nama,
            ]);

        $picList = User::where('role', 'pic_keuangan')
            ->where('is_active', true)
            ->get(['id', 'nama_lengkap']);

        // Rincian biaya per kegiatan (grouped by sub kegiatan)
        $rincianBiaya = [];
        if ($pd->dja_kegiatan_id) {
            $subKegiatans = DjaSubKegiatan::with(['rincianBiayas' => fn ($q) => $q
                ->where('is_aktif', true)
                ->orderBy('urutan')])
                ->where('kegiatan_id', $pd->dja_kegiatan_id)
                ->where('is_aktif', true)
                ->orderBy('urutan')
                ->get();

            foreach ($subKegiatans as $subKegiatan) {
                $items = $subKegiatan->rincianBiayas->map(function ($item) use ($pd, $subKegiatan) {
                    $terpakai = \App\Models\PermohonanDanaItem::where('dja_rincian_biaya_id', $item->id)
                        ->whereHas('permohonanDana', fn ($q) => $q
                            ->whereNotIn('status', ['draft', 'rejected'])
                            ->where('id', '!=', $pd->id))
                        ->sum('jumlah_permintaan');

                    $existing = $pd->items->firstWhere('dja_rincian_biaya_id', $item->id);
                    $tipeNominatif = match (true) {
                        in_array($subKegiatan->kode_akun, PermohonanDanaItem::HONOR_AKUN, true) => 'honor',
                        in_array($subKegiatan->kode_akun, PermohonanDanaItem::PERJADIN_AKUN, true) => 'perjadin',
                        default => 'non_nominatif',
                    };

                    return [
                        'id' => $item->id,
                        'kode_akun' => $subKegiatan->kode_akun,
                        'nama_akun' => $subKegiatan->nama_akun,
                        'nama_item' => $item->nama_item,
                        'satuan' => $item->satuan,
                        'harga_satuan' => $item->harga_satuan,
                        'harga_satuan_aktual' => (int) ($existing?->harga_satuan ?? $item->harga_satuan),
                        'pagu_total' => $item->pagu_total,
                        'terpakai' => $terpakai,
                        'sisa_anggaran' => max(0, $item->pagu_total - $terpakai),
                        'overbudget_amount' => max(0, $terpakai - $item->pagu_total),
                        'status_anggaran' => $terpakai > $item->pagu_total ? 'overbudget' : ($terpakai == $item->pagu_total ? 'habis' : ($terpakai > 0 ? 'tersedia' : 'belum_terpakai')),
                        'volume_diminta' => $existing?->volume ?? 0,
                        'jumlah_permintaan' => $existing?->jumlah_permintaan ?? 0,
                        'tipe_nominatif' => $tipeNominatif,
                        'nominatif_count' => $existing ? $existing->nominatif()->count() : 0,
                        'nominatif' => $existing ? $existing->nominatif->map(fn ($n) => [
                            'id' => $n->id,
                            'ref_nama_id' => $n->ref_nama_id,
                            'nama' => $n->nama,
                            'nip' => $n->nip,
                            'nik' => $n->nik,
                            'npwp' => $n->npwp,
                            'gol_ruang' => $n->gol_ruang,
                            'nama_rekening' => $n->nama_rekening,
                            'no_rekening' => $n->no_rekening,
                            'nama_bank' => $n->nama_bank,
                            'email' => $n->email,
                            'pph21_persen' => (string) $n->pph21_persen,
                            'jabatan' => $n->jabatan,
                            'volume' => (string) $n->volume,
                            'harga_satuan' => (string) $n->harga_satuan,
                            'transport' => (string) $n->transport,
                            'uang_harian_vol' => (string) $n->uang_harian_vol,
                            'uang_harian_satuan' => (string) $n->uang_harian_satuan,
                            'fullboard_vol' => (string) $n->fullboard_vol,
                            'fullboard_satuan' => (string) $n->fullboard_satuan,
                            'fullday_vol' => (string) $n->fullday_vol,
                            'fullday_satuan' => (string) $n->fullday_satuan,
                            'representasi' => (string) $n->representasi,
                            'taksi_pp' => (string) $n->taksi_pp,
                            'tiket_pesawat' => (string) $n->tiket_pesawat,
                            'hotel' => (string) $n->hotel,
                        ])->values() : [],
                    ];
                })->values();

                $rincianBiaya[] = [
                    'sub_kegiatan' => [
                        'id' => $subKegiatan->id,
                        'kode_akun' => $subKegiatan->kode_akun,
                        'nama_akun' => $subKegiatan->nama_akun,
                        'pagu' => $subKegiatan->pagu,
                        'total_rincian' => $items->sum(fn ($item) => (float) $item['pagu_total']),
                        'terpakai' => $items->sum(fn ($item) => (float) $item['terpakai']),
                    ],
                    'items' => $items,
                ];
            }
        }

        return Inertia::render('Pumk/PermohonanDana/Wizard', [
            'pd' => array_merge($pd->toArray(), ['status_label' => $pd->status_label]),
            'kapokjaList' => $kapokjaList,
            'picList' => $picList,
            'rincianBiaya' => array_values($rincianBiaya),
            'refNama' => $refNama,
            'jenisDokumen' => PermohonanDanaDokumen::$JENIS,
            'no_sk' => $pd->no_sk,
            'tgl_sk' => $pd->tgl_sk?->format('Y-m-d'),
            'no_st' => $pd->no_st,
            'tgl_st' => $pd->tgl_st?->format('Y-m-d'),
        ]);
    }

    // ─── Update Step 2 — Waktu & Penanggung Jawab ────────────────────────────────

    public function updateStep2(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403);
        abort_if(! $pd->isEditable(), 403);

        $validated = $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'jam_pelaksanaan' => 'nullable|date_format:H:i',
            'kapokja_id' => 'required|exists:users,id',
            'tempat' => 'nullable|string|max:300',
            'tgl_pertanggungjawaban' => 'nullable|date',
            'pic_keuangan_id' => 'required|exists:users,id',
        ]);

        $kapokja = User::find($validated['kapokja_id']);
        $pic = User::find($validated['pic_keuangan_id']);

        $pd->update(array_merge($validated, [
            'wizard_step' => 3,
            'kapokja_name' => $kapokja?->nama_lengkap,
            'kapokja_nip' => $kapokja?->nip,
            'pic_keuangan_name' => $pic?->nama_lengkap,
            'pic_keuangan_nip' => $pic?->nip,
        ]));  // advance to step 3

        return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
            ->with('success', 'Data waktu & penanggung jawab disimpan.')
            ->with('wizard_step', 3);   // ← key konsisten dengan frontend useEffect
    }

    // ─── Update Step 3 — Upload Dokumen ──────────────────────────────────────────

    public function uploadDokumen(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403);
        abort_if(! $pd->canUploadDocuments(), 403, 'Dokumen tidak dapat diupload karena permohonan sudah dicairkan.');

        $request->validate([
            'jenis_dokumen_id' => 'required|integer|between:1,9',
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png|max:10240',
        ]);

        $jenis = (int) $request->jenis_dokumen_id;

        if ($jenis === 2) {
            $request->validate([
                'no_sk' => 'required|string|max:100',
                'tgl_sk' => 'required|date',
            ]);
        } elseif ($jenis === 3) {
            $request->validate([
                'no_st' => 'required|string|max:100',
                'tgl_st' => 'required|date',
            ]);
        }

        $file = $request->file('file');
        $path = $file->store("permohonan_dana/{$pd->id}/dokumen", 'local');

        PermohonanDanaDokumen::create([
            'permohonan_dana_id' => $pd->id,
            'jenis_dokumen_id' => $jenis,
            'nama_jenis' => PermohonanDanaDokumen::$JENIS[$jenis] ?? 'Dokumen',
            'nama_file' => $file->getClientOriginalName(),
            'path_file' => $path,
            'ukuran_file' => $file->getSize(),
        ]);

        if ($jenis === 2) {
            $pd->update([
                'no_sk' => $request->no_sk,
                'tgl_sk' => $request->tgl_sk,
            ]);
        } elseif ($jenis === 3) {
            $pd->update([
                'no_st' => $request->no_st,
                'tgl_st' => $request->tgl_st,
            ]);
        }

        return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
            ->with('success', 'Dokumen berhasil diupload.')
            ->with('wizard_step', 3);
    }

    public function hapusDokumen(Request $request, PermohonanDana $pd, PermohonanDanaDokumen $dokumen): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403);
        abort_if(! $pd->canUploadDocuments(), 403, 'Dokumen tidak dapat dihapus karena permohonan sudah dicairkan.');
        abort_if($dokumen->permohonan_dana_id !== $pd->id, 403);

        Storage::disk('local')->delete($dokumen->path_file);

        if ($dokumen->jenis_dokumen_id === 2) {
            $pd->update(['no_sk' => null, 'tgl_sk' => null]);
        } elseif ($dokumen->jenis_dokumen_id === 3) {
            $pd->update(['no_st' => null, 'tgl_st' => null]);
        }

        $dokumen->delete();

        return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
            ->with('success', 'Dokumen dihapus.')
            ->with('wizard_step', 3);
    }

    // ─── LPJ (Laporan Pertanggungjawaban) ──────────────────────────────────────────

    public function uploadLpj(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403);
        abort_if($pd->status !== 'dicairkan', 422, 'LPJ hanya dapat diupload setelah permohonan dicairkan.');
        abort_if($pd->lpj_uploaded_at, 422, 'LPJ sudah pernah diupload.');

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $file = $request->file('file');
        $path = $file->store("permohonan_dana/{$pd->id}/lpj", 'local');
        $user = $request->user();

        \DB::transaction(function () use ($pd, $path, $file, $user) {
            $pd->update([
                'lpj_file_path' => $path,
                'lpj_file_name' => $file->getClientOriginalName(),
                'lpj_uploaded_at' => now(),
                'lpj_uploaded_by' => $user->id,
                'lpj_uploaded_by_name' => $user->nama_lengkap,
            ]);
        });

        return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
            ->with('success', 'LPJ berhasil diupload.');
    }

    public function hapusLpj(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403);
        abort_if(! $pd->lpj_uploaded_at, 422, 'Belum ada LPJ yang diupload.');

        Storage::disk('local')->delete($pd->lpj_file_path);

        $pd->update([
            'lpj_file_path' => null,
            'lpj_file_name' => null,
            'lpj_uploaded_at' => null,
            'lpj_uploaded_by' => null,
            'lpj_uploaded_by_name' => null,
        ]);

        return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
            ->with('success', 'LPJ berhasil dihapus.');
    }

    // ─── Update Step 4 — Rincian Biaya ───────────────────────────────────────────

    public function updateStep4(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403);
        abort_if(! $pd->isEditable(), 403);

        $request->validate([
            'items' => 'required|array',
            'items.*.dja_rincian_biaya_id' => 'required|exists:dja_rincian_biaya,id',
            'items.*.volume' => 'required|numeric|min:0',
            'items.*.harga_satuan' => 'required|numeric|min:0',
            'items.*.jumlah_permintaan' => 'required|numeric|min:0',
            'nominatif' => 'nullable|array',
            'nominatif.*.dja_rincian_biaya_id' => 'required|exists:dja_rincian_biaya,id',
            'nominatif.*.nama' => 'required|string|max:150',
            'nominatif.*.jabatan' => 'nullable|string|max:100',
            'nominatif.*.volume' => 'nullable|numeric|min:0',
            'nominatif.*.harga_satuan' => 'nullable|numeric|min:0',
            'nominatif.*.pph21_persen' => 'nullable|numeric|min:0',
        ]);

        $nominatifData = $request->input('nominatif', []);

        $submittedDjaIds = collect($request->items)
            ->pluck('dja_rincian_biaya_id')
            ->unique()
            ->toArray();

        $nominatifDjaIds = collect($nominatifData)
            ->pluck('dja_rincian_biaya_id')
            ->unique()
            ->toArray();

        $allSubmittedDjaIds = array_unique(array_merge($submittedDjaIds, $nominatifDjaIds));

        $itemsWithNominatif = $pd->items()
            ->whereNotIn('dja_rincian_biaya_id', $allSubmittedDjaIds)
            ->whereHas('nominatif')
            ->get();

        if ($itemsWithNominatif->isNotEmpty()) {
            $item = $itemsWithNominatif->first();

            return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
                ->with('error',
                    "Item [{$item->kode_akun}] {$item->uraian} sudah memiliki data nominatif. "
                    .'Hapus nominatif terlebih dahulu sebelum menghapus item ini.'
                )
                ->with('wizard_step', 4);
        }

        // ── Validasi: harga satuan tidak boleh melebihi SBM ─────────────────────
        foreach ($request->items as $item) {
            $rincian = DjaRincianBiaya::with('subKegiatan')->find($item['dja_rincian_biaya_id']);
            if ($item['harga_satuan'] > $rincian->harga_satuan) {
                return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
                    ->with('error',
                        "Harga satuan [{$rincian->subKegiatan?->kode_akun}] {$rincian->nama_item} ".
                        'tidak boleh melebihi SBM (Rp '.number_format($rincian->harga_satuan, 0, ',', '.').').'
                    )
                    ->with('wizard_step', 4);
            }
        }

        $rincianById = DjaRincianBiaya::with('subKegiatan')
            ->whereIn('id', collect($nominatifData)->pluck('dja_rincian_biaya_id')->unique()->filter())
            ->get()
            ->keyBy('id');

        foreach ($nominatifData as $row) {
            $rincian = $rincianById->get($row['dja_rincian_biaya_id'] ?? null);
            if (! $rincian) {
                continue;
            }

            $hargaSatuan = (float) ($row['harga_satuan'] ?? 0);
            if ($hargaSatuan > (float) $rincian->harga_satuan) {
                return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
                    ->with('error',
                        "Harga satuan nominatif {$row['nama']} untuk [{$rincian->subKegiatan?->kode_akun}] {$rincian->nama_item} ".
                        'tidak boleh melebihi SBM (Rp '.number_format((float) $rincian->harga_satuan, 0, ',', '.').').'
                    )
                    ->with('wizard_step', 4);
            }
        }

        // ── Semua modify data dalam 1 transaction dengan lock ────────────────────
        try {
            \DB::transaction(function () use ($request, $pd, $allSubmittedDjaIds, $nominatifData) {
                // Validasi pagu dengan lockForUpdate
                foreach ($request->items as $item) {
                    if ((float) $item['jumlah_permintaan'] == 0) {
                        continue;
                    }
                    $rincian = DjaRincianBiaya::with('subKegiatan')->lockForUpdate()->find($item['dja_rincian_biaya_id']);
                    $jumlah = (float) $item['jumlah_permintaan'];

                    $terpakai = \App\Models\PermohonanDanaItem::where('dja_rincian_biaya_id', $rincian->id)
                        ->whereHas('permohonanDana', fn ($q) => $q
                            ->whereNotIn('status', ['draft', 'rejected'])
                            ->where('id', '!=', $pd->id))
                        ->sum('jumlah_permintaan');

                    $sisaAnggaran = max(0, $rincian->pagu_total - $terpakai);
                    if ($jumlah > $sisaAnggaran) {
                        throw new \Exception(
                            "Item [{$rincian->subKegiatan?->kode_akun}] {$rincian->nama_item} ".
                            'memerlukan Rp '.number_format($jumlah, 0, ',', '.').' '.
                            'tetapi sisa pagu hanya Rp '.number_format($sisaAnggaran, 0, ',', '.').'.'
                        );
                    }
                }

                // Hapus item yang tidak ada di submitted list DAN belum punya nominatif
                $pd->items()->whereNotIn('dja_rincian_biaya_id', $allSubmittedDjaIds)
                    ->whereDoesntHave('nominatif')
                    ->delete();

                // Upsert items
                foreach ($request->items as $idx => $item) {
                    $jumlah = (float) $item['jumlah_permintaan'];
                    $volume = (float) $item['volume'];
                    $hargaAktual = (float) $item['harga_satuan'];

                    if ($jumlah == 0) {
                        continue;
                    }

                    $rincian = DjaRincianBiaya::with('subKegiatan')->find($item['dja_rincian_biaya_id']);
                    $existingItem = $pd->items()->where('dja_rincian_biaya_id', $rincian->id)->first();

                    if ($existingItem) {
                        $existingItem->update([
                            'uraian' => $rincian->nama_item,
                            'volume' => $volume,
                            'harga_satuan' => $hargaAktual,
                            'total' => $jumlah,
                            'jumlah_permintaan' => $jumlah,
                            'urutan' => $idx + 1,
                        ]);
                    } else {
                        $pd->items()->create([
                            'dja_rincian_biaya_id' => $rincian->id,
                            'kode_akun' => $rincian->subKegiatan?->kode_akun,
                            'uraian' => $rincian->nama_item,
                            'volume' => $volume,
                            'satuan' => $rincian->satuan,
                            'harga_satuan' => $hargaAktual,
                            'total' => $jumlah,
                            'jumlah_permintaan' => $jumlah,
                            'urutan' => $idx + 1,
                        ]);
                    }
                }

                // ── Nominatif: atomic replace ────────────────────────────────────
                PermohonanDanaItemNominatif::where('permohonan_dana_id', $pd->id)->delete();

                foreach (array_values($nominatifData) as $urutan => $row) {
                    $item = $pd->items()->where('dja_rincian_biaya_id', $row['dja_rincian_biaya_id'])->first();
                    if (! $item) {
                        continue;
                    }

                    $refNamaId = $row['ref_nama_id'] ?? null;
                    $pph21 = (float) ($row['pph21_persen'] ?? 0);
                    $volume = (float) ($row['volume'] ?? 1);
                    $hargaSatuan = (float) ($row['harga_satuan'] ?? 0);
                    $jumlahBruto = round($volume * $hargaSatuan, 2);
                    $jumlahPajak = round($jumlahBruto * ($pph21 / 100), 2);
                    $jumlahDiterima = round($jumlahBruto - $jumlahPajak, 2);

                    $uraian = strtolower($item->uraian ?? '');
                    $transport = 0;
                    $uangHarianVol = 0;
                    $uangHarianSatuan = 0;
                    $uangHarianJumlah = 0;
                    $fullboardVol = 0;
                    $fullboardSatuan = 0;
                    $fullboardJumlah = 0;
                    $fulldayVol = 0;
                    $fulldaySatuan = 0;
                    $fulldayJumlah = 0;
                    $representasi = 0;
                    $taksiPp = 0;
                    $tiketPesawat = 0;
                    $hotel = 0;

                    if ($item->isPerjadin()) {
                        $vol = $volume;
                        $hs = $hargaSatuan;
                        $jml = round($vol * $hs, 2);
                        if (preg_match('/fullboard/i', $uraian)) {
                            $fullboardVol = $vol;
                            $fullboardSatuan = $hs;
                            $fullboardJumlah = $jml;
                        } elseif (preg_match('/fullday|full\s*day/i', $uraian)) {
                            $fulldayVol = $vol;
                            $fulldaySatuan = $hs;
                            $fulldayJumlah = $jml;
                        } elseif (preg_match('/uang\s*harian/i', $uraian)) {
                            $uangHarianVol = $vol;
                            $uangHarianSatuan = $hs;
                            $uangHarianJumlah = $jml;
                        } elseif (preg_match('/representasi/i', $uraian)) {
                            $representasi = $jml;
                        } elseif (preg_match('/tiket\s*pesawat/i', $uraian)) {
                            $tiketPesawat = $jml;
                        } elseif (preg_match('/biaya\s*penginapan|hotel|akomodasi/i', $uraian)) {
                            $hotel = $jml;
                        } elseif (preg_match('/taksi/i', $uraian)) {
                            $taksiPp = $jml;
                        } elseif (preg_match('/transport/i', $uraian)) {
                            $transport = $jml;
                        }
                    }

                    $jumlahPerjadin = $transport + $uangHarianJumlah + $fullboardJumlah
                                    + $fulldayJumlah + $representasi + $taksiPp
                                    + $tiketPesawat + $hotel;

                    PermohonanDanaItemNominatif::create([
                        'permohonan_dana_item_id' => $item->id,
                        'permohonan_dana_id' => $pd->id,
                        'ref_nama_id' => $refNamaId ?: null,
                        'nama' => $row['nama'],
                        'nip' => $row['nip'] ?? null,
                        'nik' => $row['nik'] ?? null,
                        'npwp' => $row['npwp'] ?? null,
                        'gol_ruang' => $row['gol_ruang'] ?? null,
                        'nama_rekening' => $row['nama_rekening'] ?? null,
                        'no_rekening' => $row['no_rekening'] ?? null,
                        'nama_bank' => $row['nama_bank'] ?? null,
                        'email' => $row['email'] ?? null,
                        'pph21_persen' => $pph21,
                        'jabatan' => $row['jabatan'] ?? null,
                        'volume' => $volume,
                        'harga_satuan' => $hargaSatuan,
                        'jumlah_bruto' => $jumlahBruto,
                        'jumlah_pajak' => $jumlahPajak,
                        'jumlah_diterima' => $jumlahDiterima,
                        'transport' => $transport,
                        'uang_harian_vol' => $uangHarianVol,
                        'uang_harian_satuan' => $uangHarianSatuan,
                        'uang_harian_jumlah' => $uangHarianJumlah,
                        'fullboard_vol' => $fullboardVol,
                        'fullboard_satuan' => $fullboardSatuan,
                        'fullboard_jumlah' => $fullboardJumlah,
                        'fullday_vol' => $fulldayVol,
                        'fullday_satuan' => $fulldaySatuan,
                        'fullday_jumlah' => $fulldayJumlah,
                        'representasi' => $representasi,
                        'taksi_pp' => $taksiPp,
                        'tiket_pesawat' => $tiketPesawat,
                        'hotel' => $hotel,
                        'jumlah_perjadin' => $jumlahPerjadin,
                        'urutan' => $urutan,
                    ]);
                }

                // Recalculate total after nominatif affects items
                $pd->update([
                    'total_anggaran' => $pd->items()->sum('total'),
                    'wizard_step' => max($pd->wizard_step, 4),
                ]);
            });
        } catch (\Exception $e) {
            return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
                ->with('error', $e->getMessage())
                ->with('wizard_step', 4);
        }

        $pd->invalidateTerpakaiCache();

        return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
            ->with('success', 'Rincian biaya disimpan.')
            ->with('wizard_step', 4);
    }

    // ─── Submit (Draft → Submitted) ───────────────────────────────────────────────

    public function submit(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403);
        abort_if(! $pd->isEditable(), 403, 'Permohonan tidak dapat diajukan pada status ini.');

        if (! $pd->tanggal_mulai || ! $pd->kapokja_id || ! $pd->pic_keuangan_id) {
            return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
                ->with('error', 'Lengkapi data waktu & penanggung jawab (Step 2) terlebih dahulu sebelum mengajukan.')
                ->with('wizard_step', 2);
        }

        // ── Validasi Nominatif ─────────────────────────────────────────────────
        // Item honor/perjadin yang volume > 0 WAJIB memiliki minimal 1 data nominatif.
        $honorAkun = \App\Models\PermohonanDanaItem::HONOR_AKUN;
        $perjadinAkun = \App\Models\PermohonanDanaItem::PERJADIN_AKUN;

        $itemsBelumNominatif = $pd->items()
            ->with('nominatif')
            ->where('volume', '>', 0)
            ->whereIn('kode_akun', array_merge($honorAkun, $perjadinAkun))
            ->get()
            ->filter(fn ($item) => $item->nominatif->isEmpty());

        if ($itemsBelumNominatif->isNotEmpty()) {
            $labels = $itemsBelumNominatif->map(fn ($item) => "[{$item->kode_akun}] {$item->uraian}"
            )->implode(', ');

            return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
                ->with('error', "Isi data nominatif peserta terlebih dahulu untuk item berikut: {$labels}.")
                ->with('wizard_step', 4);
        }

        // ── Safety Net: Validasi tidak melebihi sisa pagu (dengan lock) ──────────
        try {
            \DB::transaction(function () use ($pd) {
                foreach ($pd->items as $item) {
                    if ($item->volume == 0) {
                        continue;
                    }

                    $rincian = $item->djaRincianBiaya;
                    if (! $rincian) {
                        continue;
                    }

                    $rincian = DjaRincianBiaya::with('subKegiatan')->lockForUpdate()->find($rincian->id);

                    $terpakai = \App\Models\PermohonanDanaItem::where('dja_rincian_biaya_id', $rincian->id)
                        ->whereHas('permohonanDana', fn ($q) => $q
                            ->whereNotIn('status', ['draft', 'rejected'])
                            ->where('id', '!=', $pd->id))
                        ->sum('jumlah_permintaan');

                    $sisaAnggaran = max(0, $rincian->pagu_total - $terpakai);

                    if ($item->jumlah_permintaan > $sisaAnggaran) {
                        throw new \Exception(
                            "Item [{$rincian->subKegiatan?->kode_akun}] {$rincian->nama_item} ".
                            'memerlukan Rp '.number_format($item->jumlah_permintaan, 0, ',', '.').' '.
                            'tetapi sisa pagu hanya Rp '.number_format($sisaAnggaran, 0, ',', '.').'.'
                        );
                    }
                }

                $user = auth()->user();
                $pd->update([
                    'status' => 'submitted',
                    'wizard_step' => 4,
                    'submitted_at' => now(),
                    'created_by_name' => $user->nama_lengkap,
                    'created_by_nip' => $user->nip,
                    // Clear rejection fields on re-submit (history preserved in permohonan_dana_rejections table)
                    'catatan_penolakan' => null,
                    'rejected_at_step' => null,
                    'rejected_at' => null,
                ]);
            });
        } catch (\Exception $e) {
            return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
                ->with('error', $e->getMessage())
                ->with('wizard_step', 4);
        }

        $pd->invalidateTerpakaiCache();

        return redirect()->route('pumk.permohonan-dana.index')
            ->with('success', "Permohonan {$pd->nomor_permohonan} berhasil diajukan ke KA.TIM.");
    }

    // ─── Download Surat Permohonan Dana (Excel) ────────────────────────────────────

    public function print(Request $request, PermohonanDana $pd): \Illuminate\Http\Response
    {
        abort_if($pd->created_by !== $request->user()->id, 403);

        return (new PermohonanDanaExport($pd))->download();
    }

    // ─── Destroy ──────────────────────────────────────────────────────────────────

    public function destroy(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403);
        abort_if(! $pd->isEditable(), 403);

        // Hapus file dokumen
        foreach ($pd->dokumens as $dok) {
            Storage::disk('local')->delete($dok->path_file);
        }

        $pd->invalidateTerpakaiCache();
        $pd->delete();

        return redirect()->route('pumk.permohonan-dana.index')
            ->with('success', 'Permohonan dihapus.');
    }

    // ─── Cascading Dropdown API ───────────────────────────────────────────────────

    public function getSasaran(Request $request)
    {
        $list = DjaSasaran::where('program_id', $request->program_id)
            ->where('is_aktif', true)->orderBy('kode')
            ->get(['id', 'kode', 'nama', 'pagu']);

        return response()->json($list);
    }

    public function getKro(Request $request)
    {
        $list = DjaKro::where('sasaran_id', $request->sasaran_id)
            ->where('is_aktif', true)->orderBy('kode')
            ->get(['id', 'kode', 'nama', 'pagu']);

        return response()->json($list);
    }

    public function getRo(Request $request)
    {
        $list = DjaRo::where('kro_id', $request->kro_id)
            ->where('is_aktif', true)->orderBy('kode')
            ->get(['id', 'kode', 'nama', 'pagu']);

        return response()->json($list);
    }

    public function getKomponen(Request $request)
    {
        $list = DjaKomponen::where('ro_id', $request->ro_id)
            ->where('is_aktif', true)->orderBy('kode')
            ->get(['id', 'kode', 'nama', 'pagu']);

        return response()->json($list);
    }

    public function getKegiatan(Request $request)
    {
        $list = DjaKegiatan::where('komponen_id', $request->komponen_id)
            ->where('is_aktif', true)->orderBy('kode')
            ->get(['id', 'kode', 'nama', 'pagu']);

        return response()->json($list);
    }
}
