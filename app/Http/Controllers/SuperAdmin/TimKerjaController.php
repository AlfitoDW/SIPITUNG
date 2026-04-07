<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\TimKerja;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TimKerjaController extends Controller
{
    public function index()
    {
        return Inertia::render('SuperAdmin/TimKerja/Index', [
            'timKerjas' => TimKerja::orderBy('kode')->get(['id', 'kode', 'nama', 'nama_singkat', 'deskripsi', 'is_active']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'kode'        => 'required|string|max:20|unique:tim_kerja,kode',
            'nama'        => 'required|string|max:255',
            'nama_singkat'=> 'nullable|string|max:100',
            'deskripsi'   => 'nullable|string|max:500',
        ]);

        $data['is_active'] = true;

        TimKerja::create($data);

        return back()->with('success', 'Tim kerja berhasil ditambahkan.');
    }

    public function update(Request $request, TimKerja $timKerja)
    {
        $data = $request->validate([
            'kode'        => 'required|string|max:20|unique:tim_kerja,kode,' . $timKerja->id,
            'nama'        => 'required|string|max:255',
            'nama_singkat'=> 'nullable|string|max:100',
            'deskripsi'   => 'nullable|string|max:500',
        ]);

        $timKerja->update($data);

        return back()->with('success', 'Tim kerja berhasil diperbarui.');
    }

    public function destroy(TimKerja $timKerja)
    {
        if ($timKerja->users()->exists()) {
            return back()->withErrors(['delete' => 'Tim kerja tidak dapat dihapus karena masih memiliki anggota.']);
        }

        $timKerja->delete();

        return back()->with('success', 'Tim kerja berhasil dihapus.');
    }

    public function toggleActive(TimKerja $timKerja)
    {
        $timKerja->update(['is_active' => ! $timKerja->is_active]);

        return back()->with('success', 'Status tim kerja berhasil diubah.');
    }
}
