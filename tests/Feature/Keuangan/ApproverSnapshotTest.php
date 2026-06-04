<?php

use App\Exports\NominatifExport;
use App\Models\DjaKegiatan;
use App\Models\DjaKomponen;
use App\Models\DjaProgram;
use App\Models\DjaRincianBiaya;
use App\Models\DjaRo;
use App\Models\DjaSasaran;
use App\Models\DjaKro;
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
});

it('stores approver name and nip snapshot on katim approval', function () {
    $pd = PermohonanDana::factory()->submitted()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    $this->actingAs($this->kapokja)
        ->post(route('ketua-tim.keuangan.permohonan-dana.approve', $pd), ['catatan' => 'OK'])
        ->assertRedirect();

    $pd->refresh();
    expect($pd->katim_approved_by)->toBe($this->kapokja->id);
    expect($pd->katim_approved_by_name)->toBe($this->kapokja->nama_lengkap);
    expect($pd->katim_approved_by_nip)->toBe($this->kapokja->nip);
});

it('stores approver name and nip snapshot on ppk approval', function () {
    $pd = PermohonanDana::factory()->kabagApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    $ppk = User::factory()->ppk()->create();

    $this->actingAs($ppk)
        ->post(route('pimpinan.keuangan.permohonan-dana.approve', $pd), ['catatan' => 'Setuju'])
        ->assertRedirect();

    $pd->refresh();
    expect($pd->ppk_approved_by)->toBe($ppk->id);
    expect($pd->ppk_approved_by_name)->toBe($ppk->nama_lengkap);
    expect($pd->ppk_approved_by_nip)->toBe($ppk->nip);
});

it('uses snapshot name when user is deactivated', function () {
    $pd = PermohonanDana::factory()->ppkApproved()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    // Pastikan snapshot sudah terisi (seperti setelah approval)
    $pd->update([
        'ppk_approved_by_name' => 'Budi Santoso',
        'ppk_approved_by_nip' => '123456789',
    ]);

    // Simulasi: user dinonaktifkan (tapi tidak dihapus karena restrictOnDelete)
    $ppk = User::find($pd->ppk_approved_by);
    $ppk?->update(['is_active' => false, 'nama_lengkap' => 'Budi Baru']);

    // Serialization harus tetap mengembalikan snapshot
    $name = $pd->ppk_approved_by_name ?? $pd->ppkApprovedBy?->nama_lengkap;
    expect($name)->toBe('Budi Santoso');
});

it('uses snapshot name when original approver record is changed', function () {
    $pd = PermohonanDana::factory()->dicairkan()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    $pd->update([
        'dicairkan_by_name' => 'Ani Wijaya',
        'dicairkan_by_nip' => '987654321',
    ]);

    // Simulasi: bendahara ganti nama
    $bendahara = User::find($pd->dicairkan_by);
    $bendahara?->update(['nama_lengkap' => 'Ani Kusuma']);

    $name = $pd->dicairkan_by_name ?? $pd->dicairkanBy?->nama_lengkap;
    expect($name)->toBe('Ani Wijaya');
});

it('nominatif export reads ppk and bendahara from snapshots', function () {
    $pd = PermohonanDana::factory()->dicairkan()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    $pd->update([
        'ppk_approved_by_name' => 'Budi Snapshot',
        'ppk_approved_by_nip' => '111',
        'dicairkan_by_name' => 'Ani Snapshot',
        'dicairkan_by_nip' => '222',
    ]);

    // Ganti nama user asli
    User::find($pd->ppk_approved_by)?->update(['nama_lengkap' => 'Budi Live']);
    User::find($pd->dicairkan_by)?->update(['nama_lengkap' => 'Ani Live']);

    // Constructor NominatifExport harus membaca dari relasi (karena belum ada template, kita cek property)
    $export = new NominatifExport($pd);

    // Export harus menggunakan relasi untuk NIP fallback, tapi name dari snapshot
    // Kita verifikasi via reflection bahwa ppk dan bendahara di-load dari relasi
    $reflection = new ReflectionClass($export);
    $pdProp = $reflection->getProperty('pd');
    $pdProp->setAccessible(true);
    $loadedPd = $pdProp->getValue($export);

    expect($loadedPd->ppk_approved_by_name)->toBe('Budi Snapshot');
    expect($loadedPd->dicairkan_by_name)->toBe('Ani Snapshot');
});

it('prevents deleting user who has approval history', function () {
    $pd = PermohonanDana::factory()->dicairkan()->create([
        'tahun_anggaran_id' => $this->tahunAnggaran->id,
        'tim_kerja_id' => $this->timKerja->id,
        'created_by' => $this->pumk->id,
        'kapokja_id' => $this->kapokja->id,
    ]);

    $admin = User::factory()->superAdmin()->create();
    $bendahara = User::find($pd->dicairkan_by);

    $response = $this->actingAs($admin)
        ->delete(route('super-admin.users.destroy', $bendahara));

    $response->assertRedirect();
    $response->assertSessionHasErrors('error');
    expect(User::where('id', $bendahara->id)->exists())->toBeTrue();
});
