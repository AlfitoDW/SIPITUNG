<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use App\Models\UserTahunAnggaran;
use Inertia\Inertia;
use Inertia\Response;

class DataMasterController extends Controller
{
    public function index(): Response
    {
        $users = User::select('id', 'nama_lengkap', 'nip', 'username', 'email', 'role', 'pimpinan_type', 'tim_kerja_id', 'is_active')
            ->orderBy('nama_lengkap')
            ->get();

        $userAssignments = UserTahunAnggaran::with(['user:id,nama_lengkap,nip,username,email', 'timKerja:id,nama,kode'])
            ->get()
            ->groupBy('tahun_anggaran_id')
            ->map(fn ($group) => $group->map(fn ($item) => [
                'id' => $item->id,
                'user_id' => $item->user_id,
                'tahun_anggaran_id' => $item->tahun_anggaran_id,
                'tim_kerja_id' => $item->tim_kerja_id,
                'role' => $item->role,
                'pimpinan_type' => $item->pimpinan_type,
                'is_active' => $item->is_active,
                'nama_lengkap' => $item->user->nama_lengkap,
                'nip' => $item->user->nip,
                'username' => $item->user->username,
                'email' => $item->user->email,
            ])->values());

        $tahunAnggaran = TahunAnggaran::orderBy('tahun', 'desc')
            ->get()
            ->map(fn ($t) => array_merge($t->toArray(), [
                'has_user_assignments' => $userAssignments->has($t->id) && $userAssignments[$t->id]->isNotEmpty(),
            ]));

        return Inertia::render('SuperAdmin/DataMaster', [
            'managementAccount' => $users,
            'userAssignments' => $userAssignments,
            'timKerja' => TimKerja::select('id', 'nama', 'kode')
                ->where('is_active', true)
                ->orderBy('nama')
                ->get(),
            'tahunAnggaran' => $tahunAnggaran,
        ]);
    }
}
