<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\User;
use App\Models\UserTahunAnggaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private const ROLES = ['super_admin', 'ketua_tim_kerja', 'pimpinan', 'bendahara', 'pumk', 'pic_keuangan'];

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'nip' => 'nullable|string|max:20',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'nullable|email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(self::ROLES)],
            'pimpinan_type' => [
                'nullable',
                Rule::requiredIf($request->role === 'pimpinan'),
                Rule::in(['kabag_umum', 'ppk']),
            ],
            'tim_kerja_id' => [
                'nullable',
                Rule::requiredIf(in_array($request->role, ['ketua_tim_kerja', 'pumk'])),
                'exists:tim_kerja,id',
            ],
        ]);

        $user = User::create([
            'nama_lengkap' => $validated['nama_lengkap'],
            'nip' => $validated['nip'] ?? null,
            'username' => $validated['username'],
            'email' => $validated['email'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'pimpinan_type' => $validated['pimpinan_type'] ?? null,
            'tim_kerja_id' => $validated['tim_kerja_id'] ?? null,
            'is_active' => true,
        ]);

        // Sync pivot untuk default tahun (kecuali super_admin)
        if ($user->role !== 'super_admin') {
            $defaultTahun = TahunAnggaran::where('is_default', true)->first();
            if ($defaultTahun) {
                UserTahunAnggaran::create([
                    'user_id' => $user->id,
                    'tahun_anggaran_id' => $defaultTahun->id,
                    'tim_kerja_id' => $user->tim_kerja_id,
                    'role' => $user->role,
                    'pimpinan_type' => $user->pimpinan_type,
                    'is_active' => $user->is_active,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Akun berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'nip' => 'nullable|string|max:20',
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['nullable', 'email'],
            'role' => ['required', Rule::in(self::ROLES)],
            'pimpinan_type' => [
                'nullable',
                Rule::requiredIf($request->role === 'pimpinan'),
                Rule::in(['kabag_umum', 'ppk']),
            ],
            'tim_kerja_id' => [
                'nullable',
                Rule::requiredIf(in_array($request->role, ['ketua_tim_kerja', 'pumk'])),
                'exists:tim_kerja,id',
            ],
        ]);

        $user->update([
            'nama_lengkap' => $validated['nama_lengkap'],
            'nip' => $validated['nip'] ?? null,
            'username' => $validated['username'],
            'email' => $validated['email'] ?? null,
            'role' => $validated['role'],
            'pimpinan_type' => $validated['pimpinan_type'] ?? null,
            'tim_kerja_id' => $validated['tim_kerja_id'] ?? null,
        ]);

        // Sync pivot untuk default tahun (kecuali super_admin)
        if ($user->role !== 'super_admin') {
            $defaultTahun = TahunAnggaran::where('is_default', true)->first();
            if ($defaultTahun) {
                UserTahunAnggaran::updateOrCreate(
                    ['user_id' => $user->id, 'tahun_anggaran_id' => $defaultTahun->id],
                    [
                        'tim_kerja_id' => $user->tim_kerja_id,
                        'role' => $user->role,
                        'pimpinan_type' => $user->pimpinan_type,
                        'is_active' => $user->is_active,
                    ]
                );
            }
        }

        return redirect()->back()->with('success', 'Akun berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->withErrors(['error' => 'Tidak dapat menghapus akun sendiri.']);
        }

        $hasApprovalHistory = PermohonanDana::where('katim_approved_by', $user->id)
            ->orWhere('kabag_approved_by', $user->id)
            ->orWhere('ppk_approved_by', $user->id)
            ->orWhere('pic_approved_by', $user->id)
            ->orWhere('dicairkan_by', $user->id)
            ->exists();

        if ($hasApprovalHistory) {
            return redirect()->back()->withErrors(['error' => 'User tidak dapat dihapus karena pernah melakukan approval pada permohonan dana. Nonaktifkan saja jika tidak lagi digunakan.']);
        }

        $hasCreatedPermohonan = PermohonanDana::where('created_by', $user->id)->exists();

        if ($hasCreatedPermohonan) {
            return redirect()->back()->withErrors(['error' => 'User tidak dapat dihapus karena pernah membuat permohonan dana. Nonaktifkan saja jika tidak lagi digunakan.']);
        }

        $user->delete();

        return redirect()->back()->with('success', 'Akun berhasil dihapus.');
    }

    public function toggleStatus(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->withErrors(['error' => 'Tidak dapat menonaktifkan akun sendiri.']);
        }

        $user->update(['is_active' => ! $user->is_active]);

        // Sync pivot status untuk default tahun
        if ($user->role !== 'super_admin') {
            $defaultTahun = TahunAnggaran::where('is_default', true)->first();
            if ($defaultTahun) {
                UserTahunAnggaran::where('user_id', $user->id)
                    ->where('tahun_anggaran_id', $defaultTahun->id)
                    ->update(['is_active' => $user->is_active]);
            }
        }

        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Akun berhasil {$status}.");
    }

    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return redirect()->back()->with('success', "Password akun {$user->nama_lengkap} berhasil direset.");
    }

    public function toggleStatusByTahun(User $user, TahunAnggaran $tahunAnggaran)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->withErrors(['error' => 'Tidak dapat menonaktifkan akun sendiri.']);
        }

        $assignment = UserTahunAnggaran::where('user_id', $user->id)
            ->where('tahun_anggaran_id', $tahunAnggaran->id)
            ->first();

        if (! $assignment) {
            return redirect()->back()->withErrors(['error' => 'User tidak memiliki assignment untuk tahun ini.']);
        }

        $assignment->update(['is_active' => ! $assignment->is_active]);

        // Sync global user status juga (optional, tapi keep consistent)
        $user->update(['is_active' => $assignment->is_active]);

        $status = $assignment->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Assignment berhasil {$status}.");
    }
}
