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

    $this->bendahara = User::factory()->bendahara()->create();
    $this->superAdmin = User::factory()->superAdmin()->create();
    $this->pic = User::factory()->picKeuangan()->create();
});

it('bendahara can buka kunci pic_approved request', function () {
    $pd = PermohonanDana::factory()->picApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'pic_keuangan_id' => $this->pic->id,
    ]);

    $this->actingAs($this->bendahara)
        ->post(route('bendahara.permohonan-dana.buka-kunci', $pd), [
            'alasan' => 'Perlu revisi anggaran',
        ])
        ->assertRedirect();

    $fresh = $pd->fresh();
    expect($fresh->status)->toBe('rejected')
        ->and($fresh->rejected_at_step)->toBe('dibuka_kunci')
        ->and($fresh->alasan_pembukaan_kunci)->toBe('Perlu revisi anggaran');
});

it('super_admin can buka kunci katim_approved request', function () {
    $pd = PermohonanDana::factory()->katimApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'pic_keuangan_id' => $this->pic->id,
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('super-admin.keuangan.permohonan-dana.buka-kunci', $pd), [
            'alasan' => 'Salah input',
        ])
        ->assertRedirect();

    expect($pd->fresh()->status)->toBe('rejected');
});

it('blocks buka kunci for draft status', function () {
    $pd = PermohonanDana::factory()->draft()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'pic_keuangan_id' => $this->pic->id,
    ]);

    $this->actingAs($this->bendahara)
        ->post(route('bendahara.permohonan-dana.buka-kunci', $pd))
        ->assertForbidden();
});

it('blocks buka kunci for dicairkan with bukti bayar', function () {
    $pd = PermohonanDana::factory()->dicairkan()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'pic_keuangan_id' => $this->pic->id,
        'bukti_bayar_path' => 'bukti-bayar/2026/05/test.jpg',
    ]);

    $this->actingAs($this->bendahara)
        ->post(route('bendahara.permohonan-dana.buka-kunci', $pd))
        ->assertForbidden();
});

it('allows buka kunci without alasan', function () {
    $pd = PermohonanDana::factory()->picApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'pic_keuangan_id' => $this->pic->id,
    ]);

    $this->actingAs($this->bendahara)
        ->post(route('bendahara.permohonan-dana.buka-kunci', $pd))
        ->assertRedirect();

    expect($pd->fresh()->status)->toBe('rejected');
});

it('allows buka kunci for dicairkan without bukti bayar and reverts to ppk_approved', function () {
    $pd = PermohonanDana::factory()->dicairkan()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'pic_keuangan_id' => $this->pic->id,
        'bukti_bayar_path' => null, // No bukti bayar yet
        'dicairkan_by' => $this->bendahara->id,
        'dicairkan_at' => now(),
        'catatan_pencairan' => 'Dicairkan untuk kegiatan',
    ]);

    $this->actingAs($this->bendahara)
        ->post(route('bendahara.permohonan-dana.buka-kunci', $pd), [
            'alasan' => 'Perlu koreksi sebelum transfer',
        ])
        ->assertRedirect();

    $fresh = $pd->fresh();
    expect($fresh->status)->toBe('ppk_approved')
        ->and($fresh->dicairkan_by)->toBeNull()
        ->and($fresh->dicairkan_at)->toBeNull()
        ->and($fresh->catatan_pencairan)->toBeNull()
        ->and($fresh->dibuka_kunci_by)->toBe($this->bendahara->id)
        ->and($fresh->alasan_pembukaan_kunci)->toBe('Perlu koreksi sebelum transfer');
});
