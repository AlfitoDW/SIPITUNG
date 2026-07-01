<?php

use App\Models\PeriodePengukuran;
use App\Models\TahunAnggaran;
use App\Models\User;

function superAdminUser(): User
{
    return User::create([
        'nama_lengkap' => 'Super Admin Test',
        'username' => 'superadmin-test',
        'email' => 'superadmin-test@example.test',
        'password' => 'password',
        'role' => 'super_admin',
        'is_active' => true,
    ]);
}

function defaultTahunAnggaran(): TahunAnggaran
{
    return TahunAnggaran::create([
        'tahun' => 2026,
        'label' => 'TA 2026',
        'is_active' => true,
        'is_default' => true,
    ]);
}

test('menyimpan periode triwulan yang dipilih tanpa mengubah TW1', function () {
    $tahun = defaultTahunAnggaran();
    $this->actingAs(superAdminUser());

    $tw1 = PeriodePengukuran::create([
        'tahun_anggaran_id' => $tahun->id,
        'triwulan' => 'TW1',
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-03-31 16:59:59',
        'is_active' => false,
    ]);

    $this->post(route('super-admin.pengukuran.periode.store'), [
        'triwulan' => 'TW2',
        'tanggal_mulai' => '2026-04-01',
        'tanggal_selesai' => '2026-06-30T15:30',
    ])->assertRedirect();

    expect($tw1->fresh()->tanggal_selesai->format('Y-m-d H:i:s'))
        ->toBe('2026-03-31 16:59:59');

    $tw2 = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
        ->where('triwulan', 'TW2')
        ->firstOrFail();

    expect($tw2->tanggal_mulai->format('Y-m-d'))->toBe('2026-04-01')
        ->and($tw2->tanggal_selesai->timezone('Asia/Jakarta')->format('Y-m-d H:i:s'))->toBe('2026-06-30 15:30:00');
});

test('membuka satu periode menutup periode lain pada tahun yang sama', function () {
    $tahun = defaultTahunAnggaran();
    $this->actingAs(superAdminUser());

    $tw1 = PeriodePengukuran::create([
        'tahun_anggaran_id' => $tahun->id,
        'triwulan' => 'TW1',
        'is_active' => true,
    ]);

    $tw2 = PeriodePengukuran::create([
        'tahun_anggaran_id' => $tahun->id,
        'triwulan' => 'TW2',
        'is_active' => false,
    ]);

    $this->patch(route('super-admin.pengukuran.periode.toggle', $tw2))
        ->assertRedirect();

    expect($tw1->fresh()->is_active)->toBeFalse()
        ->and($tw2->fresh()->is_active)->toBeTrue();
});
