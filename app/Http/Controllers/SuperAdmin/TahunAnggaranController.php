<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\TahunAnggaran;
use App\Models\UserTahunAnggaran;
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
        if ($tahunAnggaran->permohonanDana()->exists()) {
            return back()->withErrors(['delete' => 'Tahun anggaran tidak dapat dihapus karena masih memiliki histori permohonan dana. Nonaktifkan saja jika tidak lagi digunakan.']);
        }

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

        $newTahunId = $request->tahun_anggaran_id;
        $user = auth()->user();

        // Guard: non-super_admin HARUS punya assignment di tahun baru
        if ($user && ! $user->isSuperAdmin()) {
            $hasAssignment = UserTahunAnggaran::where('user_id', $user->id)
                ->where('tahun_anggaran_id', $newTahunId)
                ->where('is_active', true)
                ->exists();

            if (! $hasAssignment) {
                auth()->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->with('error', 'Akun tidak terdaftar untuk tahun anggaran yang dipilih.');
            }
        }

        session(['tahun_anggaran_id' => $newTahunId]);

        // Paksa full browser reload agar Inertia prefetch cache terhapus
        return Inertia::location(url()->previous() ?: route('dashboard'));
    }

    public function cloneUsers(Request $request, TahunAnggaran $tahunAnggaran): RedirectResponse
    {
        $request->validate([
            'source_tahun_anggaran_id' => ['required', Rule::exists('tahun_anggaran', 'id')->where('is_active', true)],
        ]);

        // Guard: tahun target harus masih kosong
        if ($tahunAnggaran->hasUserAssignments()) {
            return back()->withErrors(['clone' => 'Tahun anggaran ini sudah memiliki data user. Clone tidak dapat dilakukan.']);
        }

        $sourceId = $request->source_tahun_anggaran_id;

        // Guard: source tidak boleh sama dengan target
        if ($sourceId == $tahunAnggaran->id) {
            return back()->withErrors(['clone' => 'Tahun sumber tidak boleh sama dengan tahun target.']);
        }

        // Ambil semua user assignment dari tahun sumber (kecuali super_admin)
        $sourceRows = UserTahunAnggaran::where('tahun_anggaran_id', $sourceId)
            ->where('role', '!=', 'super_admin')
            ->get();

        if ($sourceRows->isEmpty()) {
            return back()->withErrors(['clone' => 'Tahun sumber tidak memiliki data user yang dapat di-clone.']);
        }

        // Insert ke tahun target
        $now = now();
        $insertData = $sourceRows->map(fn ($row) => [
            'user_id' => $row->user_id,
            'tahun_anggaran_id' => $tahunAnggaran->id,
            'tim_kerja_id' => $row->tim_kerja_id,
            'role' => $row->role,
            'pimpinan_type' => $row->pimpinan_type,
            'is_active' => $row->is_active,
            'created_at' => $now,
            'updated_at' => $now,
        ])->toArray();

        UserTahunAnggaran::insert($insertData);

        return back()->with('success', "Berhasil meng-clone {$sourceRows->count()} user dari tahun sumber ke tahun {$tahunAnggaran->tahun}.");
    }
}
