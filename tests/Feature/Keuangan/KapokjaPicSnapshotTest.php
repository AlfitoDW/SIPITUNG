<?php

use App\Models\DjaKegiatan;
use App\Models\DjaKomponen;
use App\Models\DjaKro;
use App\Models\DjaProgram;
use App\Models\DjaRo;
use App\Models\DjaSasaran;
use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tahun = TahunAnggaran::factory()->create(['tahun' => 2026]);
    $this->timKerja = TimKerja::factory()->create(['is_active' => true]);

    $this->pumk = User::factory()->pumk()->create([
        'tim_kerja_id' => $this->timKerja->id,
        'is_active' => true,
    ]);

    $this->kapokja = User::factory()->ketuaTim()->create([
        'username' => 'kapokja_test',
        'nama_lengkap' => 'Budi Kapokja',
        'nip' => '198001011234567890',
        'is_active' => true,
    ]);

    $this->picKeuangan = User::factory()->create([
        'username' => 'pic_test',
        'role' => 'pic_keuangan',
        'nama_lengkap' => 'Ani PIC',
        'nip' => '198502022345678901',
        'is_active' => true,
    ]);

    $program = DjaProgram::factory()->create(['tahun_anggaran' => 2026, 'is_aktif' => true]);
    $sasaran = DjaSasaran::factory()->create(['program_id' => $program->id, 'is_aktif' => true]);
    $kro = DjaKro::factory()->create(['sasaran_id' => $sasaran->id, 'is_aktif' => true]);
    $ro = DjaRo::factory()->create(['kro_id' => $kro->id, 'is_aktif' => true]);
    $komponen = DjaKomponen::factory()->create(['ro_id' => $ro->id, 'is_aktif' => true]);
    $kegiatan = DjaKegiatan::factory()->create(['komponen_id' => $komponen->id, 'is_aktif' => true]);

    $this->pd = PermohonanDana::create([
        'tahun_anggaran_id' => $this->tahun->id,
        'tim_kerja_id' => $this->timKerja->id,
        'dja_program_id' => $program->id,
        'dja_sasaran_id' => $sasaran->id,
        'dja_kro_id' => $kro->id,
        'dja_ro_id' => $ro->id,
        'dja_komponen_id' => $komponen->id,
        'dja_kegiatan_id' => $kegiatan->id,
        'judul_pekerjaan' => 'Test',
        'nomor_permohonan' => '001/TEST/01/2026',
        'keperluan' => 'Test',
        'status' => 'draft',
        'wizard_step' => 1,
        'created_by' => $this->pumk->id,
    ]);
});

it('saves kapokja and pic snapshot on update step 2', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $this->patch(route('pumk.permohonan-dana.step2', $this->pd->id), [
        'tanggal_mulai' => now()->toDateString(),
        'tanggal_selesai' => now()->toDateString(),
        'kapokja_id' => $this->kapokja->id,
        'tempat' => 'Jakarta',
        'pic_keuangan_id' => $this->picKeuangan->id,
    ])->assertRedirect();

    $this->pd->refresh();
    expect($this->pd->kapokja_name)->toBe('Budi Kapokja');
    expect($this->pd->kapokja_nip)->toBe('198001011234567890');
    expect($this->pd->pic_keuangan_name)->toBe('Ani PIC');
    expect($this->pd->pic_keuangan_nip)->toBe('198502022345678901');
});

it('snapshot survives kapokja name change', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $this->patch(route('pumk.permohonan-dana.step2', $this->pd->id), [
        'tanggal_mulai' => now()->toDateString(),
        'tanggal_selesai' => now()->toDateString(),
        'kapokja_id' => $this->kapokja->id,
        'tempat' => 'Jakarta',
        'pic_keuangan_id' => $this->picKeuangan->id,
    ]);

    $this->kapokja->update(['nama_lengkap' => 'Budi Baru']);

    $this->pd->refresh();
    expect($this->pd->kapokja_name)->toBe('Budi Kapokja');
});

it('snapshot survives kapokja deletion', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $this->patch(route('pumk.permohonan-dana.step2', $this->pd->id), [
        'tanggal_mulai' => now()->toDateString(),
        'tanggal_selesai' => now()->toDateString(),
        'kapokja_id' => $this->kapokja->id,
        'tempat' => 'Jakarta',
        'pic_keuangan_id' => $this->picKeuangan->id,
    ]);

    $this->kapokja->delete();

    $this->pd->refresh();
    expect($this->pd->kapokja_name)->toBe('Budi Kapokja');
});

it('controllers read snapshot not live', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $this->patch(route('pumk.permohonan-dana.step2', $this->pd->id), [
        'tanggal_mulai' => now()->toDateString(),
        'tanggal_selesai' => now()->toDateString(),
        'kapokja_id' => $this->kapokja->id,
        'tempat' => 'Jakarta',
        'pic_keuangan_id' => $this->picKeuangan->id,
    ]);

    $this->kapokja->update(['nama_lengkap' => 'Budi Baru']);

    $res = $this->get(route('pumk.permohonan-dana.index'));
    $res->assertOk();
    $res->assertInertia(fn ($page) => $page
        ->has('permohonan.0.kapokja_name')
        ->where('permohonan.0.kapokja_name', 'Budi Kapokja')
    );
});

it('does not fallback to live relation when snapshot is null', function () {
    $pdLama = PermohonanDana::create([
        'tahun_anggaran_id' => $this->tahun->id,
        'tim_kerja_id' => $this->timKerja->id,
        'dja_program_id' => $this->pd->dja_program_id,
        'dja_sasaran_id' => $this->pd->dja_sasaran_id,
        'dja_kro_id' => $this->pd->dja_kro_id,
        'dja_ro_id' => $this->pd->dja_ro_id,
        'dja_komponen_id' => $this->pd->dja_komponen_id,
        'dja_kegiatan_id' => $this->pd->dja_kegiatan_id,
        'judul_pekerjaan' => 'Test Lama',
        'nomor_permohonan' => '002/TEST/01/2026',
        'keperluan' => 'Test',
        'status' => 'submitted',
        'wizard_step' => 1,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
        'pic_keuangan_id' => $this->picKeuangan->id,
        'submitted_at' => now(),
    ]);

    // Delete users
    $this->kapokja->delete();
    $this->picKeuangan->delete();

    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $res = $this->get(route('pumk.permohonan-dana.index'));
    $res->assertOk();
    $res->assertInertia(fn ($page) => $page
        ->has('permohonan')
        ->where('permohonan.1.kapokja_name', null)
        ->where('permohonan.1.pic_keuangan_name', null)
    );
});
