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

    $this->kabag = User::factory()->kabag()->create();
    $this->ppk = User::factory()->ppk()->create();
    $this->pic = User::factory()->picKeuangan()->create();
    $this->bendahara = User::factory()->bendahara()->create();
});

it('katim can reject submitted and pumk can resubmit', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
        'pic_keuangan_id' => $this->pic->id,
    ]);

    // Reject
    $this->actingAs($this->kapokja)
        ->post(route('ketua-tim.keuangan.permohonan-dana.reject', $pd), [
            'catatan' => 'Dokumen kurang lengkap',
        ])
        ->assertRedirect();

    $fresh = $pd->fresh();
    expect($fresh->status)->toBe('rejected')
        ->and($fresh->rejected_at_step)->toBe('katim')
        ->and($fresh->catatan_penolakan)->toBe('Dokumen kurang lengkap')
        ->and($fresh->rejections)->toHaveCount(1)
        ->and($fresh->rejections->first()->rejected_by)->toBe($this->kapokja->id)
        ->and($fresh->rejections->first()->catatan)->toBe('Dokumen kurang lengkap');

    // Resubmit
    $this->actingAs($this->pumk)
        ->patch(route('pumk.permohonan-dana.submit', $fresh))
        ->assertRedirect();

    expect($fresh->fresh()->status)->toBe('submitted');
});

it('kabag gets 403 rejecting (view-only)', function () {
    $pd = PermohonanDana::factory()->katimApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
        'pic_keuangan_id' => $this->pic->id,
    ]);

    $this->actingAs($this->kabag)
        ->post(route('pimpinan.keuangan.permohonan-dana.reject', $pd), [
            'catatan' => 'Tidak berhak',
        ])
        ->assertForbidden();

    expect($pd->fresh()->status)->toBe('katim_approved');
});

it('ppk can reject pic_approved', function () {
    $pd = PermohonanDana::factory()->picApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
        'pic_keuangan_id' => $this->pic->id,
    ]);

    $this->actingAs($this->ppk)
        ->post(route('pimpinan.keuangan.permohonan-dana.reject', $pd), [
            'catatan' => 'Perlu revisi TOR',
        ])
        ->assertRedirect();

    $fresh = $pd->fresh();
    expect($fresh->status)->toBe('rejected')
        ->and($fresh->rejected_at_step)->toBe('ppk')
        ->and($fresh->rejections)->toHaveCount(1);
});

it('pic can reject katim_approved', function () {
    $pd = PermohonanDana::factory()->katimApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
        'pic_keuangan_id' => $this->pic->id,
    ]);

    $this->actingAs($this->pic)
        ->post(route('pic-keuangan.permohonan-dana.reject', $pd), [
            'catatan' => 'Nominatif belum lengkap',
        ])
        ->assertRedirect();

    $fresh = $pd->fresh();
    expect($fresh->status)->toBe('rejected')
        ->and($fresh->rejected_at_step)->toBe('pic')
        ->and($fresh->rejections)->toHaveCount(1);
});

it('bendahara can reject ppk_approved', function () {
    $pd = PermohonanDana::factory()->ppkApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
        'pic_keuangan_id' => $this->pic->id,
    ]);

    $this->actingAs($this->bendahara)
        ->post(route('bendahara.permohonan-dana.reject', $pd), [
            'catatan' => 'Perlu perbaikan rekening',
        ])
        ->assertRedirect();

    $fresh = $pd->fresh();
    expect($fresh->status)->toBe('rejected')
        ->and($fresh->rejected_at_step)->toBe('bendahara')
        ->and($fresh->rejections)->toHaveCount(1);
});
