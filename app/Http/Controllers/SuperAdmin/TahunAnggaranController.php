<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\TahunAnggaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

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
            'tahun' => 'required|integer|unique:tahun_anggaran,tahun,' . $tahunAnggaran->id,
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
}
