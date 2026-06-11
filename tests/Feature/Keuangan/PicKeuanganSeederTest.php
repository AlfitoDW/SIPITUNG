<?php

use App\Models\TahunAnggaran;
use App\Models\User;
use App\Models\UserTahunAnggaran;
use Database\Seeders\RefNamaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('seeds the four global PIC Keuangan users with active year assignments', function () {
    $tahun2026 = TahunAnggaran::factory()->create([
        'tahun' => '2026',
        'is_default' => true,
        'is_active' => true,
    ]);
    $tahun2027 = TahunAnggaran::factory()->create([
        'tahun' => '2027',
        'is_default' => false,
        'is_active' => true,
    ]);

    $this->seed(RefNamaSeeder::class);

    $picUsers = User::where('role', 'pic_keuangan')
        ->where('is_active', true)
        ->orderBy('username')
        ->get(['id', 'username', 'nama_lengkap', 'tim_kerja_id']);

    expect($picUsers->pluck('username')->all())->toBe([
        'pic.elih',
        'pic.prayitno',
        'pic.tantri',
        'pic.yeni',
    ]);

    expect($picUsers->pluck('nama_lengkap')->all())->toBe([
        'Elih Ermawati',
        'Prayitno',
        'Tantri Rinjani',
        'Yeni Handayani',
    ]);

    expect($picUsers->pluck('tim_kerja_id')->all())->toBe([null, null, null, null]);

    foreach ([$tahun2026, $tahun2027] as $tahun) {
        $assignments = UserTahunAnggaran::where('tahun_anggaran_id', $tahun->id)
            ->where('role', 'pic_keuangan')
            ->where('is_active', true)
            ->whereIn('user_id', $picUsers->pluck('id'))
            ->count();

        expect($assignments)->toBe(4);
    }
});
