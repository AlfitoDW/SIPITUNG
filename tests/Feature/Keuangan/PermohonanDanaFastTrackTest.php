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
});

describe('fast-track approval', function () {
    it('approves permohonan from submitted to pic_approved in one go', function () {
        $pd = PermohonanDana::factory()->submitted()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->pumk)
            ->post(route('pumk.permohonan-dana.fast-track', $pd))
            ->assertRedirect();

        $fresh = $pd->fresh();
        expect($fresh->status)->toBe('pic_approved')
            ->and($fresh->katim_approved_by)->toBe($this->kapokja->id)
            ->and($fresh->katim_approved_at)->not->toBeNull()
            ->and($fresh->kabag_approved_by)->toBe($this->kabag->id)
            ->and($fresh->kabag_approved_at)->not->toBeNull()
            ->and($fresh->ppk_approved_by)->toBe($this->ppk->id)
            ->and($fresh->ppk_approved_at)->not->toBeNull()
            ->and($fresh->pic_approved_by)->toBe($this->pic->id)
            ->and($fresh->pic_approved_at)->not->toBeNull();
    });

    it('rejects fast-track if status is not submitted', function () {
        $pd = PermohonanDana::factory()->draft()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->pumk)
            ->post(route('pumk.permohonan-dana.fast-track', $pd))
            ->assertStatus(422);

        expect($pd->fresh()->status)->toBe('draft');
    });

    it('rejects fast-track by non-creator', function () {
        $otherPumk = User::factory()->pumk()->create();

        $pd = PermohonanDana::factory()->submitted()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($otherPumk)
            ->post(route('pumk.permohonan-dana.fast-track', $pd))
            ->assertStatus(403);

        expect($pd->fresh()->status)->toBe('submitted');
    });

    it('does not affect other permohonan', function () {
        $pd1 = PermohonanDana::factory()->submitted()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $pd2 = PermohonanDana::factory()->submitted()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->pumk)
            ->post(route('pumk.permohonan-dana.fast-track', $pd1))
            ->assertRedirect();

        expect($pd1->fresh()->status)->toBe('pic_approved')
            ->and($pd2->fresh()->status)->toBe('submitted');
    });
});
