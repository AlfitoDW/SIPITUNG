<?php

use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->timKerja = TimKerja::factory()->create();

    $this->pumk = User::factory()->pumk()->create([
        'tim_kerja_id' => $this->timKerja->id,
    ]);

    $this->kapokja = User::factory()->ketuaTim()->create([
        'tim_kerja_id' => $this->timKerja->id,
    ]);
});

it('prevents deleting tahun_anggaran that has permohonan_dana', function () {
    $tahunAnggaran = TahunAnggaran::factory()->create();

    PermohonanDana::factory()->draft()->create([
        'tahun_anggaran_id' => $tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    $admin = User::factory()->superAdmin()->create();
    $response = $this->actingAs($admin)
        ->delete(route('super-admin.tahun-anggaran.destroy', $tahunAnggaran));

    $response->assertRedirect();
    $response->assertSessionHasErrors('delete');

    // Pastikan data tetap ada
    expect(TahunAnggaran::where('id', $tahunAnggaran->id)->exists())->toBeTrue();
});

it('allows deleting tahun_anggaran that has no permohonan_dana', function () {
    $tahunAnggaran = TahunAnggaran::factory()->create();
    // Tidak ada SPJ

    $admin = User::factory()->superAdmin()->create();
    $response = $this->actingAs($admin)
        ->delete(route('super-admin.tahun-anggaran.destroy', $tahunAnggaran));

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect(TahunAnggaran::where('id', $tahunAnggaran->id)->exists())->toBeFalse();
});
