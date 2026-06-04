<?php

use App\Models\DjaKegiatan;
use App\Models\DjaKomponen;
use App\Models\DjaKro;
use App\Models\DjaProgram;
use App\Models\DjaRincianBiaya;
use App\Models\DjaRo;
use App\Models\DjaSasaran;
use App\Models\PermohonanDana;
use App\Models\PermohonanDanaItem;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tahunAnggaran = TahunAnggaran::factory()->create();
    $this->timKerja = TimKerja::factory()->create();
    $this->pumk = User::factory()->pumk()->create(['tim_kerja_id' => $this->timKerja->id]);
    $this->kapokja = User::factory()->ketuaTim()->create(['tim_kerja_id' => $this->timKerja->id]);
    $this->admin = User::factory()->superAdmin()->create();

    // Build DJA hierarchy
    $this->program = DjaProgram::factory()->create(['tahun_anggaran' => $this->tahunAnggaran->tahun]);
    $this->sasaran = DjaSasaran::factory()->create(['program_id' => $this->program->id]);
    $this->kro = DjaKro::factory()->create(['sasaran_id' => $this->sasaran->id]);
    $this->ro = DjaRo::factory()->create(['kro_id' => $this->kro->id]);
    $this->komponen = DjaKomponen::factory()->create(['ro_id' => $this->ro->id]);
    $this->kegiatan = DjaKegiatan::factory()->create(['komponen_id' => $this->komponen->id]);
    $this->rincian = DjaRincianBiaya::factory()->create([
        'kegiatan_id' => $this->kegiatan->id,
        'pagu_total' => 1000000,
        'harga_satuan' => 100000,
    ]);
});

// ─── Rincian Biaya ───────────────────────────────────────────────────────────

it('prevents deleting rincian biaya used by active permohonan dana', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    PermohonanDanaItem::create([
        'permohonan_dana_id' => $pd->id,
        'dja_rincian_biaya_id' => $this->rincian->id,
        'kode_akun' => $this->rincian->kode_akun,
        'uraian' => 'Test item',
        'volume' => 5,
        'satuan' => 'orang',
        'harga_satuan' => 100000,
        'total' => 500000,
        'jumlah_permintaan' => 500000,
    ]);

    $response = $this->actingAs($this->admin)
        ->delete(route('super-admin.keuangan.master-anggaran.rincian.destroy', $this->rincian));

    $response->assertRedirect();
    $response->assertSessionHasErrors('delete');
    expect(DjaRincianBiaya::where('id', $this->rincian->id)->exists())->toBeTrue();
});

it('allows deleting rincian biaya not used by any permohonan dana', function () {
    $response = $this->actingAs($this->admin)
        ->delete(route('super-admin.keuangan.master-anggaran.rincian.destroy', $this->rincian));

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect(DjaRincianBiaya::where('id', $this->rincian->id)->exists())->toBeFalse();
});

it('allows deleting rincian biaya only used by draft permohonan dana', function () {
    $pd = PermohonanDana::factory()->draft()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    PermohonanDanaItem::create([
        'permohonan_dana_id' => $pd->id,
        'dja_rincian_biaya_id' => $this->rincian->id,
        'kode_akun' => $this->rincian->kode_akun,
        'uraian' => 'Draft item',
        'volume' => 5,
        'satuan' => 'orang',
        'harga_satuan' => 100000,
        'total' => 500000,
        'jumlah_permintaan' => 500000,
    ]);

    $response = $this->actingAs($this->admin)
        ->delete(route('super-admin.keuangan.master-anggaran.rincian.destroy', $this->rincian));

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect(DjaRincianBiaya::where('id', $this->rincian->id)->exists())->toBeFalse();
});

// ─── Kegiatan ────────────────────────────────────────────────────────────────

it('prevents deleting kegiatan that has rincian biaya used by active permohonan dana', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    PermohonanDanaItem::create([
        'permohonan_dana_id' => $pd->id,
        'dja_rincian_biaya_id' => $this->rincian->id,
        'kode_akun' => $this->rincian->kode_akun,
        'uraian' => 'Test item',
        'volume' => 5,
        'satuan' => 'orang',
        'harga_satuan' => 100000,
        'total' => 500000,
        'jumlah_permintaan' => 500000,
    ]);

    $response = $this->actingAs($this->admin)
        ->delete(route('super-admin.keuangan.master-anggaran.kegiatan.destroy', $this->kegiatan));

    $response->assertRedirect();
    $response->assertSessionHasErrors('delete');
    expect(DjaKegiatan::where('id', $this->kegiatan->id)->exists())->toBeTrue();
});

it('allows deleting kegiatan without active permohonan dana usage', function () {
    // Hapus rincian biaya dulu supaya kegiatan kosong
    $this->rincian->delete();

    $response = $this->actingAs($this->admin)
        ->delete(route('super-admin.keuangan.master-anggaran.kegiatan.destroy', $this->kegiatan));

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect(DjaKegiatan::where('id', $this->kegiatan->id)->exists())->toBeFalse();
});

// ─── Komponen ──────────────────────────────────────────────────────────────────

it('prevents deleting komponen that has rincian biaya used by active permohonan dana', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    PermohonanDanaItem::create([
        'permohonan_dana_id' => $pd->id,
        'dja_rincian_biaya_id' => $this->rincian->id,
        'kode_akun' => $this->rincian->kode_akun,
        'uraian' => 'Test item',
        'volume' => 5,
        'satuan' => 'orang',
        'harga_satuan' => 100000,
        'total' => 500000,
        'jumlah_permintaan' => 500000,
    ]);

    $response = $this->actingAs($this->admin)
        ->delete(route('super-admin.keuangan.master-anggaran.komponen.destroy', $this->komponen));

    $response->assertRedirect();
    $response->assertSessionHasErrors('delete');
    expect(DjaKomponen::where('id', $this->komponen->id)->exists())->toBeTrue();
});

// ─── RO ────────────────────────────────────────────────────────────────────────

it('prevents deleting ro that has rincian biaya used by active permohonan dana', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    PermohonanDanaItem::create([
        'permohonan_dana_id' => $pd->id,
        'dja_rincian_biaya_id' => $this->rincian->id,
        'kode_akun' => $this->rincian->kode_akun,
        'uraian' => 'Test item',
        'volume' => 5,
        'satuan' => 'orang',
        'harga_satuan' => 100000,
        'total' => 500000,
        'jumlah_permintaan' => 500000,
    ]);

    $response = $this->actingAs($this->admin)
        ->delete(route('super-admin.keuangan.master-anggaran.ro.destroy', $this->ro));

    $response->assertRedirect();
    $response->assertSessionHasErrors('delete');
    expect(DjaRo::where('id', $this->ro->id)->exists())->toBeTrue();
});

// ─── KRO ───────────────────────────────────────────────────────────────────────

it('prevents deleting kro that has rincian biaya used by active permohonan dana', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    PermohonanDanaItem::create([
        'permohonan_dana_id' => $pd->id,
        'dja_rincian_biaya_id' => $this->rincian->id,
        'kode_akun' => $this->rincian->kode_akun,
        'uraian' => 'Test item',
        'volume' => 5,
        'satuan' => 'orang',
        'harga_satuan' => 100000,
        'total' => 500000,
        'jumlah_permintaan' => 500000,
    ]);

    $response = $this->actingAs($this->admin)
        ->delete(route('super-admin.keuangan.master-anggaran.kro.destroy', $this->kro));

    $response->assertRedirect();
    $response->assertSessionHasErrors('delete');
    expect(DjaKro::where('id', $this->kro->id)->exists())->toBeTrue();
});

// ─── Sasaran ───────────────────────────────────────────────────────────────────

it('prevents deleting sasaran that has rincian biaya used by active permohonan dana', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    PermohonanDanaItem::create([
        'permohonan_dana_id' => $pd->id,
        'dja_rincian_biaya_id' => $this->rincian->id,
        'kode_akun' => $this->rincian->kode_akun,
        'uraian' => 'Test item',
        'volume' => 5,
        'satuan' => 'orang',
        'harga_satuan' => 100000,
        'total' => 500000,
        'jumlah_permintaan' => 500000,
    ]);

    $response = $this->actingAs($this->admin)
        ->delete(route('super-admin.keuangan.master-anggaran.sasaran.destroy', $this->sasaran));

    $response->assertRedirect();
    $response->assertSessionHasErrors('delete');
    expect(DjaSasaran::where('id', $this->sasaran->id)->exists())->toBeTrue();
});

// ─── Program ───────────────────────────────────────────────────────────────────

it('prevents deleting program that has rincian biaya used by active permohonan dana', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    PermohonanDanaItem::create([
        'permohonan_dana_id' => $pd->id,
        'dja_rincian_biaya_id' => $this->rincian->id,
        'kode_akun' => $this->rincian->kode_akun,
        'uraian' => 'Test item',
        'volume' => 5,
        'satuan' => 'orang',
        'harga_satuan' => 100000,
        'total' => 500000,
        'jumlah_permintaan' => 500000,
    ]);

    $response = $this->actingAs($this->admin)
        ->delete(route('super-admin.keuangan.master-anggaran.program.destroy', $this->program));

    $response->assertRedirect();
    $response->assertSessionHasErrors('delete');
    expect(DjaProgram::where('id', $this->program->id)->exists())->toBeTrue();
});

it('allows deleting program without active permohonan dana usage', function () {
    // Hapus rincian biaya dulu supaya program kosong
    $this->rincian->delete();

    $response = $this->actingAs($this->admin)
        ->delete(route('super-admin.keuangan.master-anggaran.program.destroy', $this->program));

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect(DjaProgram::where('id', $this->program->id)->exists())->toBeFalse();
});
