<?php

use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutMiddleware();
    $this->tahunAnggaran = TahunAnggaran::factory()->create();
    $this->timKerja = TimKerja::factory()->create();

    $this->pumk = User::factory()->pumk()->create(['tim_kerja_id' => $this->timKerja->id]);
    $this->kapokja = User::factory()->ketuaTim()->create(['tim_kerja_id' => $this->timKerja->id]);
    $this->kabag = User::factory()->kabag()->create();
    $this->ppk = User::factory()->ppk()->create();
    $this->pic = User::factory()->picKeuangan()->create();
});

describe('approval guard — wrong role/status combination', function () {
    it('PPK CANNOT approve katim_approved (must wait PIC Keuangan)', function () {
        $pd = PermohonanDana::factory()->katimApproved()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->ppk)
            ->post(route('pimpinan.keuangan.permohonan-dana.approve', $pd))
            ->assertStatus(422);

        expect($pd->fresh()->status)->toBe('katim_approved')
            ->and($pd->fresh()->ppk_approved_by)->toBeNull()
            ->and($pd->fresh()->ppk_approved_at)->toBeNull();
    });

    it('Kabag Umum mendapat 403 saat approve (view-only)', function () {
        $pd = PermohonanDana::factory()->katimApproved()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->kabag)
            ->post(route('pimpinan.keuangan.permohonan-dana.approve', $pd))
            ->assertForbidden();

        expect($pd->fresh()->status)->toBe('katim_approved');
    });

    it('PPK CANNOT approve submitted (must wait KA.TIM and PIC)', function () {
        $pd = PermohonanDana::factory()->submitted()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->ppk)
            ->post(route('pimpinan.keuangan.permohonan-dana.approve', $pd))
            ->assertStatus(422);

        expect($pd->fresh()->status)->toBe('submitted');
    });

    it('Kabag Umum mendapat 403 saat reject (view-only)', function () {
        $pd = PermohonanDana::factory()->katimApproved()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->kabag)
            ->post(route('pimpinan.keuangan.permohonan-dana.reject', $pd), ['catatan' => 'Test'])
            ->assertForbidden();

        expect($pd->fresh()->status)->toBe('katim_approved');
    });

    it('PPK CANNOT reject katim_approved (must wait PIC)', function () {
        $pd = PermohonanDana::factory()->katimApproved()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->ppk)
            ->post(route('pimpinan.keuangan.permohonan-dana.reject', $pd), ['catatan' => 'Test'])
            ->assertStatus(422);

        expect($pd->fresh()->status)->toBe('katim_approved');
    });
});
