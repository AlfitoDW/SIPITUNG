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

describe('happy path state transitions', function () {
    it('draft -> submitted by PUMK', function () {
        $pd = PermohonanDana::factory()->draft()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->pumk)
            ->patch(route('pumk.permohonan-dana.submit', $pd))
            ->assertRedirect();

        expect($pd->fresh()->status)->toBe('submitted');
    });

    it('submitted -> katim_approved by KA.TIM', function () {
        $pd = PermohonanDana::factory()->submitted()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->kapokja)
            ->post(route('ketua-tim.keuangan.permohonan-dana.approve', $pd))
            ->assertRedirect();

        $fresh = $pd->fresh();
        expect($fresh->status)->toBe('katim_approved')
            ->and($fresh->katim_approved_by)->toBe($this->kapokja->id)
            ->and($fresh->katim_approved_at)->not->toBeNull();
    });

    it('kabag tidak bisa approve (403)', function () {
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

    it('katim_approved -> pic_approved by PIC Keuangan', function () {
        $pd = PermohonanDana::factory()->katimApproved()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->pic)
            ->post(route('pic-keuangan.permohonan-dana.approve', $pd))
            ->assertRedirect();

        $fresh = $pd->fresh();
        expect($fresh->status)->toBe('pic_approved')
            ->and($fresh->pic_approved_by)->toBe($this->pic->id);
    });

    it('pic_approved -> ppk_approved by PPK', function () {
        $pd = PermohonanDana::factory()->picApproved()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->ppk)
            ->post(route('pimpinan.keuangan.permohonan-dana.approve', $pd))
            ->assertRedirect();

        $fresh = $pd->fresh();
        expect($fresh->status)->toBe('ppk_approved')
            ->and($fresh->ppk_approved_by)->toBe($this->ppk->id);
    });

    it('ppk_approved -> dicairkan by Bendahara', function () {
        $pd = PermohonanDana::factory()->ppkApproved()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->bendahara)
            ->post(route('bendahara.permohonan-dana.setujui', $pd))
            ->assertRedirect();

        $fresh = $pd->fresh();
        expect($fresh->status)->toBe('dicairkan')
            ->and($fresh->dicairkan_by)->toBe($this->bendahara->id);
    });
});
