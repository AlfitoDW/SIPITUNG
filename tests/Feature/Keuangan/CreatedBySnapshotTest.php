<?php

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
        'nama_lengkap' => 'Budi Santoso',
        'nip' => '198001011999011001',
    ]);
    $this->kapokja = User::factory()->ketuaTim()->create(['tim_kerja_id' => $this->timKerja->id]);
});

it('stores created_by_name and created_by_nip snapshot on submit', function () {
    $pd = PermohonanDana::factory()->draft()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    // Add a dummy item so submit passes validation
    // Use non-honor/non-perjadin account to skip nominatif requirement
    PermohonanDanaItem::create([
        'permohonan_dana_id' => $pd->id,
        'kode_akun' => '999999',
        'uraian' => 'Test item non honor',
        'volume' => 1,
        'satuan' => 'kegiatan',
        'harga_satuan' => 100000,
        'total' => 100000,
        'jumlah_permintaan' => 100000,
    ]);

    $response = $this->actingAs($this->pumk)
        ->patch(route('pumk.permohonan-dana.submit', $pd));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $pd->refresh();
    expect($pd->created_by_name)->toBe('Budi Santoso');
    expect($pd->created_by_nip)->toBe('198001011999011001');
});

it('displays snapshot name when PUMK is deactivated', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'created_by_name' => 'Budi Santoso',
        'created_by_nip' => '198001011999011001',
        'kapokja_id' => $this->kapokja->id,
    ]);

    // Deactivate PUMK
    $this->pumk->update(['is_active' => false, 'nama_lengkap' => 'Budi Diubah']);

    // Login as admin and view the SPJ
    $admin = User::factory()->superAdmin()->create();
    $response = $this->actingAs($admin)
        ->get(route('super-admin.keuangan.permohonan-dana.show', $pd));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('pd.created_by_name', 'Budi Santoso')
    );
});

it('uses snapshot name when original PUMK record name is changed', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'created_by_name' => 'Budi Santoso',
        'created_by_nip' => '198001011999011001',
        'kapokja_id' => $this->kapokja->id,
    ]);

    // PUMK ganti nama
    $this->pumk->update(['nama_lengkap' => 'Budi Wijaya']);

    $admin = User::factory()->superAdmin()->create();
    $response = $this->actingAs($admin)
        ->get(route('super-admin.keuangan.permohonan-dana.show', $pd));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('pd.created_by_name', 'Budi Santoso')
    );
});

it('blocks deleting user who is PUMK creator of permohonan dana', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'created_by_name' => 'Budi Santoso',
        'kapokja_id' => $this->kapokja->id,
    ]);

    $admin = User::factory()->superAdmin()->create();
    $response = $this->actingAs($admin)
        ->delete(route('super-admin.users.destroy', $this->pumk));

    $response->assertRedirect();
    $response->assertSessionHasErrors('error');
    expect(User::where('id', $this->pumk->id)->exists())->toBeTrue();
});
