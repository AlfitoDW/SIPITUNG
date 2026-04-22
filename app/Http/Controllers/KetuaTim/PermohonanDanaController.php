<?php

namespace App\Http\Controllers\KetuaTim;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PermohonanDanaController extends Controller
{
    // ─── Ketua Tim Kerja (semua) ──────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $tahun = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $permohonan = PermohonanDana::with(['items'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('tim_kerja_id', $timKerjaId)
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('KetuaTim/PermohonanDana/Index', [
            'tahun' => $tahun,
            'permohonan' => $permohonan,
        ]);
    }

    public function create(): Response
    {
        $tahun = TahunAnggaran::forSession();

        return Inertia::render('KetuaTim/PermohonanDana/Form', [
            'tahun' => $tahun,
            'pd' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'keperluan' => 'required|string|max:255',
            'tanggal_kegiatan' => 'required|date',
            'keterangan' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.uraian' => 'required|string|max:255',
            'items.*.volume' => 'required|numeric|min:0.01',
            'items.*.satuan' => 'required|string|max:50',
            'items.*.harga_satuan' => 'required|numeric|min:0',
            'items.*.keterangan' => 'nullable|string|max:255',
        ]);

        $tahun = TahunAnggaran::forSession();
        $timKerjaId = $request->user()->tim_kerja_id;

        $seq = PermohonanDana::where('tahun_anggaran_id', $tahun->id)->count() + 1;
        $nomor = 'PD/'.$tahun->tahun.'/'.str_pad($seq, 3, '0', STR_PAD_LEFT);

        $total = collect($validated['items'])->sum(
            fn ($item) => $item['volume'] * $item['harga_satuan']
        );

        $pd = PermohonanDana::create([
            'tahun_anggaran_id' => $tahun->id,
            'tim_kerja_id' => $timKerjaId,
            'nomor_permohonan' => $nomor,
            'keperluan' => $validated['keperluan'],
            'tanggal_kegiatan' => $validated['tanggal_kegiatan'],
            'keterangan' => $validated['keterangan'] ?? null,
            'total_anggaran' => $total,
            'status' => 'draft',
            'created_by' => $request->user()->id,
        ]);

        foreach ($validated['items'] as $idx => $item) {
            $pd->items()->create([
                'uraian' => $item['uraian'],
                'volume' => $item['volume'],
                'satuan' => $item['satuan'],
                'harga_satuan' => $item['harga_satuan'],
                'total' => $item['volume'] * $item['harga_satuan'],
                'keterangan' => $item['keterangan'] ?? null,
                'urutan' => $idx + 1,
            ]);
        }

        return redirect()->route('ketua-tim.permohonan-dana.index')
            ->with('success', 'Permohonan dana berhasil disimpan sebagai draft.');
    }

    public function edit(Request $request, PermohonanDana $pd): Response
    {
        abort_if($pd->tim_kerja_id !== $request->user()->tim_kerja_id, 403);
        abort_if(! $pd->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $tahun = TahunAnggaran::forSession();
        $pd->load('items');

        return Inertia::render('KetuaTim/PermohonanDana/Form', [
            'tahun' => $tahun,
            'pd' => $pd,
        ]);
    }

    public function update(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->tim_kerja_id !== $request->user()->tim_kerja_id, 403);
        abort_if(! $pd->isEditable(), 403, 'Dokumen tidak dapat diubah.');

        $validated = $request->validate([
            'keperluan' => 'required|string|max:255',
            'tanggal_kegiatan' => 'required|date',
            'keterangan' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.uraian' => 'required|string|max:255',
            'items.*.volume' => 'required|numeric|min:0.01',
            'items.*.satuan' => 'required|string|max:50',
            'items.*.harga_satuan' => 'required|numeric|min:0',
            'items.*.keterangan' => 'nullable|string|max:255',
        ]);

        $total = collect($validated['items'])->sum(
            fn ($item) => $item['volume'] * $item['harga_satuan']
        );

        $pd->update([
            'keperluan' => $validated['keperluan'],
            'tanggal_kegiatan' => $validated['tanggal_kegiatan'],
            'keterangan' => $validated['keterangan'] ?? null,
            'total_anggaran' => $total,
            // Reset rejection fields on update
            'rejected_by' => null,
        ]);

        $pd->items()->delete();
        foreach ($validated['items'] as $idx => $item) {
            $pd->items()->create([
                'uraian' => $item['uraian'],
                'volume' => $item['volume'],
                'satuan' => $item['satuan'],
                'harga_satuan' => $item['harga_satuan'],
                'total' => $item['volume'] * $item['harga_satuan'],
                'keterangan' => $item['keterangan'] ?? null,
                'urutan' => $idx + 1,
            ]);
        }

        return redirect()->route('ketua-tim.permohonan-dana.index')
            ->with('success', 'Permohonan dana berhasil diperbarui.');
    }

    public function destroy(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->tim_kerja_id !== $request->user()->tim_kerja_id, 403);
        abort_if(! $pd->isEditable(), 403, 'Hanya permohonan berstatus draft atau ditolak yang dapat dihapus.');

        $pd->delete();

        return redirect()->route('ketua-tim.permohonan-dana.index')
            ->with('success', 'Permohonan dana berhasil dihapus.');
    }

    public function submit(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_if($pd->tim_kerja_id !== $request->user()->tim_kerja_id, 403);
        abort_if(! $pd->isEditable(), 403, 'Dokumen tidak dapat diajukan.');

        $pd->update(['status' => 'submitted']);

        return redirect()->route('ketua-tim.permohonan-dana.index')
            ->with('success', 'Permohonan dana berhasil diajukan.');
    }

    // ─── Ketua Tim Koordinator (Perencanaan & Keuangan) ──────────────────────────

    public function approvalIndex(Request $request): Response
    {
        abort_unless($request->user()->isKetuaKoordinator(), 403, 'Akses ditolak.');

        $tahun = TahunAnggaran::forSession();

        $permohonan = PermohonanDana::with(['items', 'timKerja', 'createdBy'])
            ->where('tahun_anggaran_id', $tahun->id)
            ->where('status', 'bendahara_checked')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('KetuaTim/PermohonanDana/Approval', [
            'tahun' => $tahun,
            'permohonan' => $permohonan,
        ]);
    }

    public function approve(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_unless($request->user()->isKetuaKoordinator(), 403, 'Akses ditolak.');
        abort_if($pd->status !== 'bendahara_checked', 422, 'Status tidak valid.');

        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        $pd->update([
            'status' => 'katimku_approved',
            'katimku_approved_by' => $request->user()->id,
            'rekomendasi_katimku' => $request->rekomendasi,
        ]);

        return back()->with('success', 'Permohonan dana berhasil disetujui.');
    }

    public function reject(Request $request, PermohonanDana $pd): RedirectResponse
    {
        abort_unless($request->user()->isKetuaKoordinator(), 403, 'Akses ditolak.');
        abort_if($pd->status !== 'bendahara_checked', 422, 'Status tidak valid.');

        $request->validate(['rekomendasi' => 'nullable|string|max:1000']);

        $pd->update([
            'status' => 'rejected',
            'rejected_by' => 'ketua_perencanaan',
            'rekomendasi_katimku' => $request->rekomendasi,
        ]);

        return back()->with('success', 'Permohonan dana ditolak.');
    }
}
