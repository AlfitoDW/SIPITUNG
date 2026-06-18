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

    $this->pumk = User::factory()->pumk()->create([
        'tim_kerja_id' => $this->timKerja->id,
    ]);

    $this->kapokja = User::factory()->ketuaTim()->create([
        'tim_kerja_id' => $this->timKerja->id,
    ]);

    // Build DJA hierarchy
    $program = DjaProgram::factory()->create(['tahun_anggaran' => $this->tahunAnggaran->tahun]);
    $sasaran = DjaSasaran::factory()->create(['program_id' => $program->id]);
    $kro = DjaKro::factory()->create(['sasaran_id' => $sasaran->id]);
    $ro = DjaRo::factory()->create(['kro_id' => $kro->id]);
    $komponen = DjaKomponen::factory()->create(['ro_id' => $ro->id]);
    $this->kegiatan = DjaKegiatan::factory()->create(['komponen_id' => $komponen->id]);

    $this->rincian = DjaRincianBiaya::factory()->create([
        'kegiatan_id' => $this->kegiatan->id,
        'pagu_total' => 1000000,
        'harga_satuan' => 100000,
    ]);
});

it('rejects item exceeding pagu', function () {
    $pd = PermohonanDana::factory()->draft()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    $response = $this->actingAs($this->pumk)
        ->patch(route('pumk.permohonan-dana.step4', $pd), [
            'items' => [
                [
                    'dja_rincian_biaya_id' => $this->rincian->id,
                    'uraian' => 'Test item',
                    'volume' => 20, // 20 * 100k = 2M > pagu 1M
                    'satuan' => 'orang',
                    'harga_satuan' => 100000,
                    'jumlah_permintaan' => 2000000,
                ],
            ],
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('error');
});

it('allows item within pagu', function () {
    $pd = PermohonanDana::factory()->draft()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    $this->actingAs($this->pumk)
        ->patch(route('pumk.permohonan-dana.step4', $pd), [
            'items' => [
                [
                    'dja_rincian_biaya_id' => $this->rincian->id,
                    'uraian' => 'Test item',
                    'volume' => 5,
                    'satuan' => 'orang',
                    'harga_satuan' => 100000,
                    'jumlah_permintaan' => 500000,
                ],
            ],
        ])
        ->assertRedirect();

    expect($pd->fresh()->total_anggaran)->toEqual(500000);
});

it('blocks submit when another request already consumed budget', function () {
    // First request consumes all budget
    $pd1 = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    PermohonanDanaItem::create([
        'permohonan_dana_id' => $pd1->id,
        'dja_rincian_biaya_id' => $this->rincian->id,
        'kode_akun' => $this->rincian->kode_akun,
        'uraian' => 'First item',
        'volume' => 10,
        'satuan' => 'orang',
        'harga_satuan' => 100000,
        'total' => 1000000,
        'jumlah_permintaan' => 1000000,
    ]);

    // Second request tries to use same rincian
    $pd2 = PermohonanDana::factory()->draft()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    $response = $this->actingAs($this->pumk)
        ->patch(route('pumk.permohonan-dana.step4', $pd2), [
            'items' => [
                [
                    'dja_rincian_biaya_id' => $this->rincian->id,
                    'uraian' => 'Second item',
                    'volume' => 1,
                    'satuan' => 'orang',
                    'harga_satuan' => 100000,
                    'jumlah_permintaan' => 100000,
                ],
            ],
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('error');
});

it('invalidates terpakai cache on submit', function () {
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
        'uraian' => 'Item',
        'volume' => 5,
        'satuan' => 'orang',
        'harga_satuan' => 100000,
        'total' => 500000,
        'jumlah_permintaan' => 500000,
    ]);

    // Submit permohonan
    $this->actingAs($this->pumk)
        ->patch(route('pumk.permohonan-dana.submit', $pd))
        ->assertRedirect();

    // Cache harus invalid = terpakai sekarang 500k (bukan 0)
    $rincian = $this->rincian->fresh();
    expect((float) $rincian->terpakai)->toBe(500000.0);
});

it('invalidates terpakai cache on reject', function () {
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
        'uraian' => 'Item',
        'volume' => 5,
        'satuan' => 'orang',
        'harga_satuan' => 100000,
        'total' => 500000,
        'jumlah_permintaan' => 500000,
    ]);

    // Reject permohonan
    $this->actingAs($this->kapokja)
        ->post(route('ketua-tim.keuangan.permohonan-dana.reject', $pd), ['catatan' => 'Ditolak'])
        ->assertRedirect();

    // Cache harus invalid = terpakai sekarang 0 (karena rejected tidak dihitung)
    $rincian = $this->rincian->fresh();
    expect((float) $rincian->terpakai)->toBe(0.0);
});
