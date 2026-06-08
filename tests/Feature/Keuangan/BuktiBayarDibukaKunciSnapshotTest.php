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
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tahun = TahunAnggaran::factory()->create(['tahun' => 2026]);
    $this->timKerja = TimKerja::factory()->create(['is_active' => true]);

    $this->pumk = User::factory()->pumk()->create([
        'tim_kerja_id' => $this->timKerja->id,
        'is_active' => true,
    ]);

    $this->bendahara = User::factory()->bendahara()->create([
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
        'status' => 'dicairkan',
        'dicairkan_by' => $this->bendahara->id,
        'dicairkan_at' => now(),
        'wizard_step' => 1,
        'created_by' => $this->pumk->id,
    ]);
});

it('saves bukti bayar uploaded by snapshot', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->bendahara);

    $file = UploadedFile::fake()->image('bukti.jpg');

    $this->post(route('bendahara.permohonan-dana.upload-bukti-bayar', $this->pd->id), [
        'bukti_bayar' => $file,
    ])->assertRedirect();

    $this->pd->refresh();
    expect($this->pd->bukti_bayar_uploaded_by_name)->toBe($this->bendahara->nama_lengkap);
});

it('bukti bayar snapshot survives uploader name change', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->bendahara);

    $originalName = $this->bendahara->nama_lengkap;

    $file = UploadedFile::fake()->image('bukti.jpg');

    $this->post(route('bendahara.permohonan-dana.upload-bukti-bayar', $this->pd->id), [
        'bukti_bayar' => $file,
    ]);

    $this->bendahara->update(['nama_lengkap' => 'Bendahara Baru']);

    $this->pd->refresh();
    expect($this->pd->bukti_bayar_uploaded_by_name)->toBe($originalName);
});

it('saves dibuka kunci by snapshot', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->bendahara);

    $service = new \App\Services\PermohonanDanaService();
    $service->bukaKunci($this->pd, $this->bendahara, 'Salah input');

    $this->pd->refresh();
    expect($this->pd->dibuka_kunci_by_name)->toBe($this->bendahara->nama_lengkap);
    expect($this->pd->alasan_pembukaan_kunci)->toBe('Salah input');
});

it('dibuka kunci snapshot survives actor name change', function () {
    session(['tahun_anggaran_id' => $this->tahun->id]);
    $this->actingAs($this->bendahara);

    $originalName = $this->bendahara->nama_lengkap;

    $service = new \App\Services\PermohonanDanaService();
    $service->bukaKunci($this->pd, $this->bendahara, 'Salah input');

    $this->bendahara->update(['nama_lengkap' => 'Bendahara Baru']);

    $this->pd->refresh();
    expect($this->pd->dibuka_kunci_by_name)->toBe($originalName);
});
