<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'nip' => 'nullable|string|max:20',
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'nullable|email',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['super_admin', 'ketua_tim_kerja', 'pimpinan', 'bendahara'])],
            'pimpinan_type' => ['nullable', Rule::requiredIf($request->role === 'pimpinan'), Rule::in(['kabag_umum', 'ppk'])],
            'tim_kerja_id' => ['nullable', Rule::requiredIf($request->role === 'ketua_tim_kerja'), 'exists:tim_kerja,id'],
        ]);

        User::create([
            'nama_lengkap' => $validated['nama_lengkap'],
            'nip' => $validated['nip'] ?? null,
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'pimpinan_type' => $validated['pimpinan_type'] ?? null,
            'tim_kerja_id' => $validated['tim_kerja_id'] ?? null,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Akun berhasil ditambahkan.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'nip' => 'nullable|string|max:20',
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['nullable', 'email'],
            'role' => ['required', Rule::in(['super_admin', 'ketua_tim_kerja', 'pimpinan', 'bendahara'])],
            'pimpinan_type' => ['nullable', Rule::requiredIf($request->role === 'pimpinan'), Rule::in(['kabag_umum', 'ppk'])],
            'tim_kerja_id' => ['nullable', Rule::requiredIf($request->role === 'ketua_tim_kerja'), 'exists:tim_kerja,id'],
        ]);

        $user->update([
            'nama_lengkap' => $validated['nama_lengkap'],
            'nip' => $validated['nip'] ?? null,
            'username' => $validated['username'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'pimpinan_type' => $validated['pimpinan_type'] ?? null,
            'tim_kerja_id' => $validated['tim_kerja_id'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Akun berhasil diperbarui.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->withErrors(['error' => 'Tidak dapat menghapus akun sendiri.']);
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
}
