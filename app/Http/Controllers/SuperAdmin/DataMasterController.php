<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DataMasterController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('SuperAdmin/DataMaster', [
            'managementAccount' => User::select('id', 'nama_lengkap', 'nip', 'username', 'email', 'role', 'pimpinan_type', 'tim_kerja_id', 'is_active')
                ->orderBy('nama_lengkap')
                ->get(),
            'timKerja' => TimKerja::select('id', 'nama', 'kode')
                ->where('is_active', true)
                ->orderBy('nama')
                ->get(),
            'tahunAnggaran' => TahunAnggaran::orderBy('tahun', 'desc')
                ->get(),
        ]);
    }
}
