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

    $this->program = DjaProgram::factory()->create([
        'tahun_anggaran' => 2026,
        'kode' => '01',
        'nama' => 'Program Audit',
        'is_aktif' => true,
    ]);
    $this->sasaran = DjaSasaran::factory()->create([
        'program_id' => $this->program->id,
        'kode' => '01.01',
        'nama' => 'Sasaran Mutu',
        'is_aktif' => true,
    ]);
    $this->kro = DjaKro::factory()->create([
        'sasaran_id' => $this->sasaran->id,
        'kode' => '01.01.01',
        'nama' => 'KRO Evaluasi',
        'is_aktif' => true,
    ]);
    $this->ro = DjaRo::factory()->create([
        'kro_id' => $this->kro->id,
        'kode' => '01.01.01.01',
        'nama' => 'RO Pemantauan',
        'is_aktif' => true,
    ]);
    $this->komponen = DjaKomponen::factory()->create([
        'ro_id' => $this->ro->id,
        'kode' => '01.01.01.01.01',
        'nama' => 'Komponen Audit',
        'is_aktif' => true,
    ]);
    $this->kegiatan = DjaKegiatan::factory()->create([
        'komponen_id' => $this->komponen->id,
        'kode' => '01.01.01.01.01.01',
        'nama' => 'Kegiatan Review',
        'is_aktif' => true,
    ]);
});

it('saves dja hierarchy snapshot on store', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $this->post(route('pumk.permohonan-dana.store'), [
        'dja_program_id' => $this->program->id,
        'dja_sasaran_id' => $this->sasaran->id,
        'dja_kro_id' => $this->kro->id,
        'dja_ro_id' => $this->ro->id,
        'dja_komponen_id' => $this->komponen->id,
        'dja_kegiatan_id' => $this->kegiatan->id,
        'judul_pekerjaan' => 'DJA Test',
    ])->assertRedirect();

    $pd = PermohonanDana::where('judul_pekerjaan', 'DJA Test')->first();
    expect($pd->dja_program_nama)->toBe('Program Audit');
    expect($pd->dja_sasaran_nama)->toBe('Sasaran Mutu');
    expect($pd->dja_kro_nama)->toBe('KRO Evaluasi');
    expect($pd->dja_kro_kode)->toBe('01.01.01');
    expect($pd->dja_ro_nama)->toBe('RO Pemantauan');
    expect($pd->dja_komponen_nama)->toBe('Komponen Audit');
    expect($pd->dja_kegiatan_nama)->toBe('Kegiatan Review');
    expect($pd->dja_kegiatan_kode)->toBe('01.01.01.01.01.01');
});

it('snapshot survives dja program name change', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $this->post(route('pumk.permohonan-dana.store'), [
        'dja_program_id' => $this->program->id,
        'dja_sasaran_id' => $this->sasaran->id,
        'dja_kro_id' => $this->kro->id,
        'dja_ro_id' => $this->ro->id,
        'dja_komponen_id' => $this->komponen->id,
        'dja_kegiatan_id' => $this->kegiatan->id,
        'judul_pekerjaan' => 'DJA Test',
    ]);

    $this->program->update(['nama' => 'Program Audit Baru']);

    $pd = PermohonanDana::where('judul_pekerjaan', 'DJA Test')->first();
    expect($pd->dja_program_nama)->toBe('Program Audit');
});

it('snapshot survives dja kegiatan deletion', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $this->post(route('pumk.permohonan-dana.store'), [
        'dja_program_id' => $this->program->id,
        'dja_sasaran_id' => $this->sasaran->id,
        'dja_kro_id' => $this->kro->id,
        'dja_ro_id' => $this->ro->id,
        'dja_komponen_id' => $this->komponen->id,
        'dja_kegiatan_id' => $this->kegiatan->id,
        'judul_pekerjaan' => 'DJA Test',
    ]);

    $this->kegiatan->delete();

    $pd = PermohonanDana::where('judul_pekerjaan', 'DJA Test')->first();
    expect($pd->dja_kegiatan_nama)->toBe('Kegiatan Review');
    expect($pd->dja_kegiatan_kode)->toBe('01.01.01.01.01.01');
});

it('controllers read dja snapshot not live', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->pumk);

    $this->post(route('pumk.permohonan-dana.store'), [
        'dja_program_id' => $this->program->id,
        'dja_sasaran_id' => $this->sasaran->id,
        'dja_kro_id' => $this->kro->id,
        'dja_ro_id' => $this->ro->id,
        'dja_komponen_id' => $this->komponen->id,
        'dja_kegiatan_id' => $this->kegiatan->id,
        'judul_pekerjaan' => 'DJA Test',
    ]);

    $this->program->update(['nama' => 'Program Audit Baru']);

    $res = $this->get(route('pumk.permohonan-dana.index'));
    $res->assertOk();
    $res->assertInertia(fn ($page) => $page
        ->has('permohonan.0')
        ->where('permohonan.0.dja_program_nama', 'Program Audit')
    );
});

it('falls back to dja relations when display snapshots are missing', function () {
    $pd = PermohonanDana::factory()->create([
        'tahun_anggaran_id' => $this->tahun->id,
        'tim_kerja_id' => $this->timKerja->id,
        'dja_program_id' => $this->program->id,
        'dja_sasaran_id' => $this->sasaran->id,
        'dja_kro_id' => $this->kro->id,
        'dja_ro_id' => $this->ro->id,
        'dja_komponen_id' => $this->komponen->id,
        'dja_kegiatan_id' => $this->kegiatan->id,
        'dja_program_nama' => null,
        'dja_sasaran_nama' => null,
        'dja_kro_kode' => null,
        'dja_kro_nama' => null,
        'dja_ro_nama' => null,
        'dja_komponen_nama' => null,
        'dja_kegiatan_kode' => null,
        'dja_kegiatan_nama' => null,
    ]);

    expect($pd->djaDisplayPayload())->toMatchArray([
        'dja_program' => ['nama' => 'Program Audit'],
        'dja_sasaran' => ['nama' => 'Sasaran Mutu'],
        'dja_kro' => ['kode' => '01.01.01', 'nama' => 'KRO Evaluasi'],
        'dja_ro' => ['nama' => 'RO Pemantauan'],
        'dja_komponen' => ['nama' => 'Komponen Audit'],
        'dja_kegiatan' => ['kode' => '01.01.01.01.01.01', 'nama' => 'Kegiatan Review'],
    ]);
});

it('returns null dja display fields instead of empty objects', function () {
    $pd = PermohonanDana::factory()->create([
        'tahun_anggaran_id' => $this->tahun->id,
        'tim_kerja_id' => $this->timKerja->id,
        'dja_program_id' => null,
        'dja_sasaran_id' => null,
        'dja_kro_id' => null,
        'dja_ro_id' => null,
        'dja_komponen_id' => null,
        'dja_kegiatan_id' => null,
        'dja_program_nama' => null,
        'dja_sasaran_nama' => null,
        'dja_kro_kode' => null,
        'dja_kro_nama' => null,
        'dja_ro_nama' => null,
        'dja_komponen_nama' => null,
        'dja_kegiatan_kode' => null,
        'dja_kegiatan_nama' => null,
    ]);

    expect($pd->djaDisplayPayload())->toBe([
        'dja_program' => null,
        'dja_sasaran' => null,
        'dja_kro' => null,
        'dja_ro' => null,
        'dja_komponen' => null,
        'dja_kegiatan' => null,
    ]);
});
