<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TimKerjaController extends Controller
{
    public function index()
    {
        return Inertia::render('SuperAdmin/TimKerja/Index', [
            'timKerjas' => TimKerja::orderBy('kode')
                ->get(['id', 'kode', 'nama', 'nama_singkat', 'deskripsi', 'is_active', 'tahun_anggaran_id']),
            'tahunAnggaran' => TahunAnggaran::orderBy('tahun', 'desc')->get(['id', 'tahun', 'label', 'is_default']),
        ]);
    }

    public function store(Request $request)
    {
        $tahunId = session('tahun_anggaran_id')
            ?? TahunAnggaran::where('is_default', true)->value('id');

        $data = $request->validate([
            'kode' => [
                'required', 'string', 'max:20',
                Rule::unique('tim_kerja', 'kode')->where('tahun_anggaran_id', $tahunId),
            ],
            'nama' => 'required|string|max:255',
            'nama_singkat' => 'nullable|string|max:100',
            'deskripsi' => 'nullable|string|max:500',
        ]);

        $data['is_active'] = true;
        $data['tahun_anggaran_id'] = $tahunId;

        TimKerja::create($data);

        return back()->with('success', 'Tim kerja berhasil ditambahkan.');
    }

    public function update(Request $request, TimKerja $timKerja)
    {
        $data = $request->validate([
            'kode' => [
                'required', 'string', 'max:20',
                Rule::unique('tim_kerja', 'kode')->where('tahun_anggaran_id', $timKerja->tahun_anggaran_id)->ignore($timKerja->id),
            ],
            'nama' => 'required|string|max:255',
            'nama_singkat' => 'nullable|string|max:100',
            'deskripsi' => 'nullable|string|max:500',
        ]);

        $timKerja->update($data);

        return back()->with('success', 'Tim kerja berhasil diperbarui.');
    }

    public function destroy(TimKerja $timKerja)
    {
        if ($timKerja->users()->exists()) {
            return back()->withErrors(['delete' => 'Tim kerja tidak dapat dihapus karena masih memiliki anggota.']);
        }

        if ($timKerja->permohonanDana()->exists()) {
            return back()->withErrors(['delete' => 'Tim kerja tidak dapat dihapus karena masih memiliki histori permohonan dana. Nonaktifkan saja jika tidak lagi digunakan.']);
        }

        $timKerja->delete();

        return back()->with('success', 'Tim kerja berhasil dihapus.');
    }

    public function toggleActive(TimKerja $timKerja)
    {
        $timKerja->update(['is_active' => ! $timKerja->is_active]);

        return back()->with('success', 'Status tim kerja berhasil diubah.');
    }

    public function clone(Request $request, TahunAnggaran $tahunAnggaran)
    {
        $request->validate([
            'source_tahun_anggaran_id' => ['required', Rule::exists('tahun_anggaran', 'id')->where('is_active', true)],
        ]);

        // Guard: tahun target harus masih kosong
        if (TimKerja::where('tahun_anggaran_id', $tahunAnggaran->id)->exists()) {
            return back()->withErrors(['clone' => 'Tim kerja sudah ada untuk tahun ini.']);
        }

        $sourceId = $request->source_tahun_anggaran_id;

        // Guard: source tidak boleh sama dengan target
        if ($sourceId == $tahunAnggaran->id) {
            return back()->withErrors(['clone' => 'Tahun sumber tidak boleh sama dengan tahun target.']);
        }

        $sourceRows = TimKerja::where('tahun_anggaran_id', $sourceId)->get();

        if ($sourceRows->isEmpty()) {
            return back()->withErrors(['clone' => 'Tahun sumber tidak memiliki tim kerja.']);
        }

        foreach ($sourceRows as $row) {
            TimKerja::create([
                'kode' => $row->kode,
                'nama' => $row->nama,
                'nama_singkat' => $row->nama_singkat,
                'deskripsi' => $row->deskripsi,
                'is_active' => $row->is_active,
                'tahun_anggaran_id' => $tahunAnggaran->id,
            ]);
        }

        return back()->with('success', "Berhasil meng-clone {$sourceRows->count()} tim kerja dari tahun sumber.");
    }
}
