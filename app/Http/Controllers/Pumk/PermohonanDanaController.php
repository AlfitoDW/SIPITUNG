<?php

namespace App\Http\Controllers\Pumk;

use App\Http\Controllers\Controller;
use App\Models\DjaKegiatan;
use App\Models\DjaKomponen;
use App\Models\DjaKro;
use App\Models\DjaProgram;
use App\Models\DjaRincianBiaya;
use App\Models\DjaRo;
use App\Models\DjaSasaran;
use App\Models\PermohonanDana;
use App\Models\PermohonanDanaDokumen;
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
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan', 'items', 'dokumens',
            'createdBy', 'katimApprovedBy', 'kabagApprovedBy', 'ppkApprovedBy', 'picApprovedBy', 'dicairkanBy',
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
                // actor names
                'created_by_name' => $pd->createdBy?->nama_lengkap ?? $pd->createdBy?->name,
                'katim_approved_by_name' => $pd->katimApprovedBy?->nama_lengkap ?? $pd->katimApprovedBy?->name,
                'kabag_approved_by_name' => $pd->kabagApprovedBy?->nama_lengkap ?? $pd->kabagApprovedBy?->name,
                'ppk_approved_by_name' => $pd->ppkApprovedBy?->nama_lengkap ?? $pd->ppkApprovedBy?->name,
                'pic_approved_by_name' => $pd->picApprovedBy?->nama_lengkap ?? $pd->picApprovedBy?->name,
                'dicairkan_by_name' => $pd->dicairkanBy?->nama_lengkap ?? $pd->dicairkanBy?->name,
                'next_approver_role' => match ($pd->status) {
                    'submitted' => 'KA.TIM',
                    'katim_approved' => 'Kabag Umum',
                    'kabag_approved' => 'PPK',
                    'ppk_approved' => 'PIC Keuangan',
                    'pic_approved' => 'Bendahara',
                    default => null,
                },
                'next_approver_name' => match ($pd->status) {
                    'submitted' => $pd->kapokja?->nama_lengkap,
                    'katim_approved' => \App\Models\User::where('role', 'pimpinan')->where('pimpinan_type', 'kabag_umum')->where('is_active', true)->value('nama_lengkap'),
                    'kabag_approved' => \App\Models\User::where('role', 'pimpinan')->where('pimpinan_type', 'ppk')->where('is_active', true)->value('nama_lengkap'),
                    'ppk_approved' => $pd->picKeuangan?->nama_lengkap,
                    'pic_approved' => \App\Models\User::where('role', 'bendahara')->where('is_active', true)->value('nama_lengkap'),
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

        $pd = PermohonanDana::create(array_merge($validated, [
            'tahun_anggaran_id' => $tahun->id,
            'tim_kerja_id' => $request->user()->tim_kerja_id,
            'nomor_permohonan' => $nomor,
            'keperluan' => $validated['judul_pekerjaan'],
            'status' => 'draft',
            'wizard_step' => 1,
            'created_by' => $request->user()->id,
        ]));

        return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
            ->with('success', "Draft {$nomor} berhasil dibuat.");
    }

    // ─── Wizard View (Step 1–4) ───────────────────────────────────────────────────

    public function wizard(Request $request, PermohonanDana $pd): Response
    {
        abort_if($pd->created_by !== $request->user()->id, 403);

        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan', 'items.djaRincianBiaya', 'dokumens',
        ]);

        // Kapokja bisa semua user aktif kecuali bendahara — sertakan tim_kerja agar frontend tahu dari tim mana
        $kapokjaList = User::with('timkerja:id,kode,nama')
            ->whereNotIn('role', ['bendahara'])
            ->where('is_active', true)
            ->orderBy('nama_lengkap')
            ->get(['id', 'nama_lengkap', 'role', 'pimpinan_type', 'tim_kerja_id'])
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

        // Rincian biaya per kegiatan (grouped by kode_akun)
        $rincianBiaya = [];
        if ($pd->dja_kegiatan_id) {
            $items = DjaRincianBiaya::where('kegiatan_id', $pd->dja_kegiatan_id)
                ->where('is_aktif', true)
                ->orderBy('kode_akun')
                ->orderBy('urutan')
                ->get()
                ->map(function ($item) use ($pd) {
                    $terpakai = \App\Models\PermohonanDanaItem::where('dja_rincian_biaya_id', $item->id)
                        ->whereHas('permohonanDana', fn ($q) => $q
                            ->whereNotIn('status', ['draft', 'rejected'])
                            ->where('id', '!=', $pd->id))
                        ->sum('jumlah_permintaan');

                    $existing = $pd->items->firstWhere('dja_rincian_biaya_id', $item->id);

                    return [
                        'id' => $item->id,
                        'kode_akun' => $item->kode_akun,
                        'nama_akun' => $item->nama_akun,
                        'nama_item' => $item->nama_item,
                        'satuan' => $item->satuan,
                        'harga_satuan' => $item->harga_satuan,
                        'harga_satuan_aktual' => (int) ($existing?->harga_satuan ?? $item->harga_satuan),
                        'pagu_total' => $item->pagu_total,
                        'terpakai' => $terpakai,
                        'sisa_anggaran' => max(0, $item->pagu_total - $terpakai),
                        'volume_diminta' => $existing?->volume ?? 0,
                        'jumlah_permintaan' => $existing?->jumlah_permintaan ?? 0,
                        // Nominatif info — tipe & jumlah peserta yang sudah diisi
                        'tipe_nominatif' => $existing?->tipe_nominatif ?? 'non_nominatif',
                        'nominatif_count' => $existing ? $existing->nominatif()->count() : 0,
                    ];
                });

            // Group by kode_akun
            foreach ($items as $item) {
                $key = $item['kode_akun'].'|'.$item['nama_akun'];
                $rincianBiaya[$key][] = $item;
            }
        }

        return Inertia::render('Pumk/PermohonanDana/Wizard', [
            'pd' => array_merge($pd->toArray(), ['status_label' => $pd->status_label]),
            'kapokjaList' => $kapokjaList,
            'picList' => $picList,
            'rincianBiaya' => array_values($rincianBiaya),
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

        $pd->update(array_merge($validated, ['wizard_step' => 3]));  // advance to step 3

        return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
            ->with('success', 'Data waktu & penanggung jawab disimpan.')
            ->with('wizard_step', 3);   // ← key konsisten dengan frontend useEffect
    }

    // ─── Update Step 3 — Upload Dokumen ──────────────────────────────────────────

    public function uploadDokumen(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->created_by !== $request->user()->id, 403);
        abort_if(! $pd->isEditable(), 403, 'Permohonan tidak dapat diubah pada status ini.');

        $request->validate([
            'jenis_dokumen_id' => 'required|integer|between:1,8',
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
        abort_if(! $pd->isEditable(), 403, 'Permohonan tidak dapat diubah pada status ini.');
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
        ]);

        // ── Validasi: tidak boleh melebihi sisa pagu ─────────────────────────────
        foreach ($request->items as $item) {
            if ($item['volume'] == 0) {
                continue;
            }

            $rincian = DjaRincianBiaya::find($item['dja_rincian_biaya_id']);

            $terpakai = \App\Models\PermohonanDanaItem::where('dja_rincian_biaya_id', $rincian->id)
                ->whereHas('permohonanDana', fn ($q) => $q
                    ->whereNotIn('status', ['draft', 'rejected'])
                    ->where('id', '!=', $pd->id))
                ->sum('jumlah_permintaan');

            $sisaAnggaran = max(0, $rincian->pagu_total - $terpakai);
            $jumlah = round($item['volume'] * $item['harga_satuan'], 2);

            if ($jumlah > $sisaAnggaran) {
                return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
                    ->with('error',
                        "Item [{$rincian->kode_akun}] {$rincian->nama_item} ".
                        'memerlukan Rp '.number_format($jumlah, 0, ',', '.').' '.
                        'tetapi sisa pagu hanya Rp '.number_format($sisaAnggaran, 0, ',', '.').'.'
                    )
                    ->with('wizard_step', 4);
            }
        }

        // ── Upsert: update existing items, create new ones, delete removed ones ──
        // PENTING: Jangan delete-all karena cascade akan menghapus nominatif yang sudah diisi!

        $submittedRincianIds = collect($request->items)
            ->filter(fn ($i) => $i['volume'] > 0)
            ->pluck('dja_rincian_biaya_id')
            ->toArray();

        // Hapus hanya item yang tidak ada di list DAN belum punya nominatif
        $pd->items()->whereNotIn('dja_rincian_biaya_id', $submittedRincianIds)
            ->whereDoesntHave('nominatif')
            ->delete();

        // ── Validasi: item yang sudah punya nominatif tidak boleh dihapus dari form ──
        $itemsWithNominatif = $pd->items()
            ->whereNotIn('dja_rincian_biaya_id', $submittedRincianIds)
            ->whereHas('nominatif')
            ->get();

        if ($itemsWithNominatif->isNotEmpty()) {
            $item = $itemsWithNominatif->first();

            return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
                ->with('error',
                    "Item [{$item->kode_akun}] {$item->uraian} sudah memiliki data nominatif. "
                    .'Hapus nominatif terlebih dahulu di Step 5 sebelum menghapus item ini.'
                )
                ->with('wizard_step', 4);
        }

        foreach ($request->items as $idx => $item) {
            if ($item['volume'] == 0) {
                continue;
            }

            $rincian = DjaRincianBiaya::find($item['dja_rincian_biaya_id']);
            $hargaAktual = (float) $item['harga_satuan'];
            $jumlah = round($item['volume'] * $hargaAktual, 2);

            // Cek apakah item dengan rincian ini sudah ada
            $existingItem = $pd->items()->where('dja_rincian_biaya_id', $rincian->id)->first();

            if ($existingItem) {
                // Update item yang sudah ada — nominatif tetap aman karena ID tidak berubah
                $existingItem->update([
                    'uraian' => $rincian->nama_item,
                    'volume' => $item['volume'],
                    'harga_satuan' => $hargaAktual,
                    'total' => $jumlah,
                    'jumlah_permintaan' => $jumlah,
                    'urutan' => $idx + 1,
                ]);
            } else {
                // Buat item baru jika belum ada
                $pd->items()->create([
                    'dja_rincian_biaya_id' => $rincian->id,
                    'kode_akun' => $rincian->kode_akun,
                    'uraian' => $rincian->nama_item,
                    'volume' => $item['volume'],
                    'satuan' => $rincian->satuan,
                    'harga_satuan' => $hargaAktual,
                    'total' => $jumlah,
                    'jumlah_permintaan' => $jumlah,
                    'urutan' => $idx + 1,
                ]);
            }
        }

        \DB::transaction(function () use ($pd) {
            $pd->lockForUpdate()->update([
                'total_anggaran' => $pd->items()->sum('total'),
                'wizard_step' => max($pd->wizard_step, 4),
            ]);
        });

        $pd->invalidateTerpakaiCache();

        return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
            ->with('success', 'Rincian biaya disimpan.')
            ->with('wizard_step', 4);   // ← tetap di step 4 setelah simpan rincian
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

        // ── Safety Net: Validasi tidak melebihi sisa pagu ──────────────────────
        foreach ($pd->items as $item) {
            if ($item->volume == 0) {
                continue;
            }

            $rincian = $item->djaRincianBiaya;
            if (! $rincian) {
                continue;
            }

            $terpakai = \App\Models\PermohonanDanaItem::where('dja_rincian_biaya_id', $rincian->id)
                ->whereHas('permohonanDana', fn ($q) => $q
                    ->whereNotIn('status', ['draft', 'rejected'])
                    ->where('id', '!=', $pd->id))
                ->sum('jumlah_permintaan');

            $sisaAnggaran = max(0, $rincian->pagu_total - $terpakai);

            if ($item->jumlah_permintaan > $sisaAnggaran) {
                return redirect()->route('pumk.permohonan-dana.wizard', $pd->id)
                    ->with('error',
                        "Item [{$rincian->kode_akun}] {$rincian->nama_item} ".
                        'memerlukan Rp '.number_format($item->jumlah_permintaan, 0, ',', '.').' '.
                        'tetapi sisa pagu hanya Rp '.number_format($sisaAnggaran, 0, ',', '.').'.'
                    )
                    ->with('wizard_step', 4);
            }
        }
        // ───────────────────────────────────────────────────────────────────────

        \DB::transaction(function () use ($pd) {
            $pd->lockForUpdate()->update([
                'status' => 'submitted',
                'wizard_step' => 4,
                'submitted_at' => now(),
            ]);
        });

        $pd->invalidateTerpakaiCache();

        return redirect()->route('pumk.permohonan-dana.index')
            ->with('success', "Permohonan {$pd->nomor_permohonan} berhasil diajukan ke KA.TIM.");
    }

    // ─── Print Preview ────────────────────────────────────────────────────────────

    public function print(Request $request, PermohonanDana $pd): Response
    {
        abort_if($pd->created_by !== $request->user()->id, 403);

        $pd->load([
            'djaProgram', 'djaSasaran', 'djaKro', 'djaRo', 'djaKomponen', 'djaKegiatan',
            'kapokja', 'picKeuangan', 'items', 'dokumens',
            'katimApprovedBy', 'kabagApprovedBy', 'ppkApprovedBy', 'picApprovedBy', 'dicairkanBy',
        ]);

        return Inertia::render('Pumk/PermohonanDana/PrintPreview', [
            'pd' => array_merge($pd->toArray(), ['status_label' => $pd->status_label]),
        ]);
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
