<?php

use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tahunAnggaran = TahunAnggaran::factory()->create();
});

it('prevents deleting tim_kerja that has permohonan_dana', function () {
    $timKerja = TimKerja::factory()->create();
    $pumk = User::factory()->pumk()->create(['tim_kerja_id' => $timKerja->id]);
    $kapokja = User::factory()->ketuaTim()->create(['tim_kerja_id' => $timKerja->id]);

    PermohonanDana::factory()->draft()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $timKerja->id,
        'created_by' => $pumk->id,
        'kapokja_id' => $kapokja->id,
    ]);

    // Lepaskan user dari tim agar guard users()->exists() tidak trigger
    User::where('tim_kerja_id', $timKerja->id)->update(['tim_kerja_id' => null]);

    $admin = User::factory()->superAdmin()->create();
    $response = $this->actingAs($admin)
        ->delete(route('super-admin.master.tim-kerja.destroy', $timKerja));

    $response->assertRedirect();
    $response->assertSessionHasErrors('delete');

    // Pastikan data tetap ada
    expect(TimKerja::where('id', $timKerja->id)->exists())->toBeTrue();
});

it('allows deleting tim_kerja that has no permohonan_dana and no users', function () {
    $timKerja = TimKerja::factory()->create();
    // Tidak ada user, tidak ada SPJ

    $admin = User::factory()->superAdmin()->create();
    $response = $this->actingAs($admin)
        ->delete(route('super-admin.master.tim-kerja.destroy', $timKerja));

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect(TimKerja::where('id', $timKerja->id)->exists())->toBeFalse();
});

it('prevents deleting tim_kerja that still has users', function () {
    $timKerja = TimKerja::factory()->create();
    User::factory()->pumk()->create(['tim_kerja_id' => $timKerja->id]);

    $admin = User::factory()->superAdmin()->create();
    $response = $this->actingAs($admin)
        ->delete(route('super-admin.master.tim-kerja.destroy', $timKerja));

    $response->assertRedirect();
    $response->assertSessionHasErrors('delete');
    expect(TimKerja::where('id', $timKerja->id)->exists())->toBeTrue();
});
