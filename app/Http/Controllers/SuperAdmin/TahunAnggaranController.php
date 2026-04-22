<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class TahunAnggaranController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'tahun' => 'required|integer|unique:tahun_anggaran,tahun',
            'label' => 'required|string',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
        ]);

        TahunAnggaran::create($request->only('tahun', 'label', 'is_active', 'is_default'));

        return back()->with('success', 'Tahun anggaran berhasil ditambahkan.');
    }

    public function update(Request $request, TahunAnggaran $tahunAnggaran): RedirectResponse
    {
        $request->validate([
            'tahun' => 'required|integer|unique:tahun_anggaran,tahun,'.$tahunAnggaran->id,
            'label' => 'required|string',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
        ]);

        $tahunAnggaran->update($request->only('tahun', 'label', 'is_active', 'is_default'));

        return back()->with('success', 'Tahun anggaran berhasil diperbarui.');
    }

    public function destroy(TahunAnggaran $tahunAnggaran): RedirectResponse
    {
        $tahunAnggaran->delete();

        return back()->with('success', 'Tahun anggaran berhasil dihapus.');
    }

    public function toggleDefault(TahunAnggaran $tahunAnggaran): RedirectResponse
    {
        TahunAnggaran::where('id', '!=', $tahunAnggaran->id)->update(['is_default' => false]);
        $tahunAnggaran->update(['is_default' => true]);

        return back()->with('success', 'Tahun anggaran default berhasil diubah.');
    }

    public function switchSession(Request $request): Response
    {
        $request->validate([
            'tahun_anggaran_id' => ['required', Rule::exists('tahun_anggaran', 'id')->where('is_active', true)],
        ]);

        session(['tahun_anggaran_id' => $request->tahun_anggaran_id]);

        // Paksa full browser reload agar Inertia prefetch cache terhapus
        return Inertia::location(url()->previous() ?: route('dashboard'));
    }
}
