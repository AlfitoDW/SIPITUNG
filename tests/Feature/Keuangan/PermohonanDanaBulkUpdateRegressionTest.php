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

    $this->pic = User::factory()->picKeuangan()->create();
    $this->bendahara = User::factory()->bendahara()->create();
});

describe('regression: approval must only affect target record', function () {
    it('KA.TIM approving one permohonan does not approve another', function () {
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

        $this->actingAs($this->kapokja)
            ->post(route('ketua-tim.keuangan.permohonan-dana.approve', $pd1))
            ->assertRedirect();

        expect($pd1->fresh()->status)->toBe('katim_approved')
            ->and($pd2->fresh()->status)->toBe('submitted');
    });

    it('PIC Keuangan approving one permohonan does not approve another', function () {
        $pd1 = PermohonanDana::factory()->katimApproved()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $pd2 = PermohonanDana::factory()->katimApproved()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->pic)
            ->post(route('pic-keuangan.permohonan-dana.approve', $pd1))
            ->assertRedirect();

        expect($pd1->fresh()->status)->toBe('pic_approved')
            ->and($pd2->fresh()->status)->toBe('katim_approved');
    });

    it('Bendahara approving one permohonan does not approve another', function () {
        $pd1 = PermohonanDana::factory()->ppkApproved()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $pd2 = PermohonanDana::factory()->ppkApproved()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->bendahara)
            ->post(route('bendahara.permohonan-dana.setujui', $pd1))
            ->assertRedirect();

        expect($pd1->fresh()->status)->toBe('dicairkan')
            ->and($pd2->fresh()->status)->toBe('ppk_approved');
    });

    it('PUMK submitting one permohonan does not submit another', function () {
        $pd1 = PermohonanDana::factory()->draft()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $pd2 = PermohonanDana::factory()->draft()->create([
            'tahun_anggaran_id' => $this->tahunAnggaran->id,
            'tim_kerja_id' => $this->timKerja->id,
            'created_by' => $this->pumk->id,
            'kapokja_id' => $this->kapokja->id,
            'pic_keuangan_id' => $this->pic->id,
        ]);

        $this->actingAs($this->pumk)
            ->patch(route('pumk.permohonan-dana.submit', $pd1))
            ->assertRedirect();

        expect($pd1->fresh()->status)->toBe('submitted')
            ->and($pd2->fresh()->status)->toBe('draft');
    });
});
