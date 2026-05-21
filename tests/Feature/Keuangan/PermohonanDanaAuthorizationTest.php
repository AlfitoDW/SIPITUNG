<?php

use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tahunAnggaran = TahunAnggaran::factory()->create();
    $this->timKerja = TimKerja::factory()->create();

    $this->pumk = User::factory()->pumk()->create([
        'tim_kerja_id' => $this->timKerja->id,
    ]);

    $this->kapokja = User::factory()->ketuaTim()->create([
        'tim_kerja_id' => $this->timKerja->id,
    ]);

    $this->picAssigned = User::factory()->picKeuangan()->create();
    $this->picOther = User::factory()->picKeuangan()->create();
    $this->bendahara = User::factory()->bendahara()->create();
    $this->kabag = User::factory()->kabag()->create();
});

it('allows assigned pic to approve', function () {
    $pd = PermohonanDana::factory()->ppkApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
        'pic_keuangan_id' => $this->picAssigned->id,
    ]);

    $this->actingAs($this->picAssigned)
        ->post(route('pic-keuangan.permohonan-dana.approve', $pd))
        ->assertRedirect();

    expect($pd->fresh()->status)->toBe('pic_approved');
});

it('forbids unassigned pic from approving', function () {
    $pd = PermohonanDana::factory()->ppkApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
        'pic_keuangan_id' => $this->picAssigned->id,
    ]);

    $this->actingAs($this->picOther)
        ->post(route('pic-keuangan.permohonan-dana.approve', $pd))
        ->assertForbidden();
});

it('forbids pumk from accessing bendahara routes', function () {
    $pd = PermohonanDana::factory()->picApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
        'pic_keuangan_id' => $this->picAssigned->id,
    ]);

    $this->actingAs($this->pumk)
        ->post(route('bendahara.permohonan-dana.setujui', $pd))
        ->assertForbidden();
});

it('forbids bendahara from approving at wrong status', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
        'pic_keuangan_id' => $this->picAssigned->id,
    ]);

    $this->actingAs($this->bendahara)
        ->post(route('bendahara.permohonan-dana.setujui', $pd))
        ->assertStatus(422);
});

it('forbids kabag from approving ppk stage', function () {
    $pd = PermohonanDana::factory()->ppkApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
        'pic_keuangan_id' => $this->picAssigned->id,
    ]);

    $this->actingAs($this->kabag)
        ->post(route('pimpinan.keuangan.permohonan-dana.approve', $pd))
        ->assertStatus(422);
});
