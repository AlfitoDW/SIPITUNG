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
    $this->timKerja = TimKerja::factory()->create([
        'nama' => 'Tim Audit',
        'kode' => 'TA01',
        'is_active' => true,
    ]);

    $this->ketua = User::factory()->ketuaTim()->create([
        'username' => 'ketua_tim',
        'nama_lengkap' => 'Charlie Ketua',
        'nip' => '199001011234567890',
        'tim_kerja_id' => $this->timKerja->id,
        'is_active' => true,
    ]);

    $this->timKerja->update(['ketua_id' => $this->ketua->id]);

    $this->pumk = User::factory()->pumk()->create([
        'tim_kerja_id' => $this->timKerja->id,
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

it('saves tim kerja snapshot on store', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $this->post(route('pumk.permohonan-dana.store'), [
        'dja_program_id' => $this->pd->dja_program_id,
        'dja_sasaran_id' => $this->pd->dja_sasaran_id,
        'dja_kro_id' => $this->pd->dja_kro_id,
        'dja_ro_id' => $this->pd->dja_ro_id,
        'dja_komponen_id' => $this->pd->dja_komponen_id,
        'dja_kegiatan_id' => $this->pd->dja_kegiatan_id,
        'judul_pekerjaan' => 'Test Baru',
    ])->assertRedirect();

    $pd = PermohonanDana::where('judul_pekerjaan', 'Test Baru')->first();
    expect($pd->tim_kerja_nama)->toBe('Tim Audit');
    expect($pd->tim_kerja_kode)->toBe('TA01');
    expect($pd->tim_kerja_ketua_name)->toBe('Charlie Ketua');
    expect($pd->tim_kerja_ketua_nip)->toBe('199001011234567890');
});

it('snapshot survives tim kerja name change', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $this->post(route('pumk.permohonan-dana.store'), [
        'dja_program_id' => $this->pd->dja_program_id,
        'dja_sasaran_id' => $this->pd->dja_sasaran_id,
        'dja_kro_id' => $this->pd->dja_kro_id,
        'dja_ro_id' => $this->pd->dja_ro_id,
        'dja_komponen_id' => $this->pd->dja_komponen_id,
        'dja_kegiatan_id' => $this->pd->dja_kegiatan_id,
        'judul_pekerjaan' => 'Test Baru',
    ]);

    $this->timKerja->update(['nama' => 'Tim Audit Baru']);

    $pd = PermohonanDana::where('judul_pekerjaan', 'Test Baru')->first();
    expect($pd->tim_kerja_nama)->toBe('Tim Audit');
});

it('snapshot survives ketua name change', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $this->post(route('pumk.permohonan-dana.store'), [
        'dja_program_id' => $this->pd->dja_program_id,
        'dja_sasaran_id' => $this->pd->dja_sasaran_id,
        'dja_kro_id' => $this->pd->dja_kro_id,
        'dja_ro_id' => $this->pd->dja_ro_id,
        'dja_komponen_id' => $this->pd->dja_komponen_id,
        'dja_kegiatan_id' => $this->pd->dja_kegiatan_id,
        'judul_pekerjaan' => 'Test Baru',
    ]);

    $pd = PermohonanDana::where('judul_pekerjaan', 'Test Baru')->first();

    // Ganti nama ketua tim
    $this->ketua->update(['nama_lengkap' => 'Charlie Baru']);

    $pd->refresh();
    expect($pd->tim_kerja_ketua_name)->toBe('Charlie Ketua');
    expect($pd->tim_kerja_ketua_nip)->toBe('199001011234567890');
});

it('controllers read tim kerja snapshot not live', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    // Hapus record beforeEach agar hanya ada 1 record di index
    $this->pd->delete();

    $this->post(route('pumk.permohonan-dana.store'), [
        'dja_program_id' => $this->pd->dja_program_id,
        'dja_sasaran_id' => $this->pd->dja_sasaran_id,
        'dja_kro_id' => $this->pd->dja_kro_id,
        'dja_ro_id' => $this->pd->dja_ro_id,
        'dja_komponen_id' => $this->pd->dja_komponen_id,
        'dja_kegiatan_id' => $this->pd->dja_kegiatan_id,
        'judul_pekerjaan' => 'Test Baru',
    ]);

    $this->timKerja->update(['nama' => 'Tim Audit Baru']);

    $res = $this->get(route('pumk.permohonan-dana.index'));
    $res->assertOk();
    $res->assertInertia(fn ($page) => $page
        ->has('permohonan', 1)
        ->where('permohonan.0.tim_kerja_nama', 'Tim Audit')
        ->where('permohonan.0.tim_kerja_kode', 'TA01')
    );
});
