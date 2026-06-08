<?php

use App\Models\DjaProgram;
use App\Models\TahunAnggaran;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->superAdmin()->create();
    $this->tahun2026 = TahunAnggaran::factory()->create(['tahun' => '2026', 'is_default' => false]);
    $this->tahun2027 = TahunAnggaran::factory()->create(['tahun' => '2027', 'is_default' => false]);
});

// Helper: set tahun session untuk test
function setTahunSession($tahun)
{
    session(['tahun_anggaran_id' => $tahun->id]);
}

// ─── Program Store ─────────────────────────────────────────────────────────────

it('allows creating program with same kode for different tahun_anggaran', function () {
    // Buat program di tahun 2026
    DjaProgram::create([
        'tahun_anggaran' => '2026',
        'kode' => '139.03.DK',
        'nama' => 'Program 2026',
        'pagu' => 1000000,
        'is_aktif' => true,
    ]);

    setTahunSession($this->tahun2027);

    // Buat program dengan kode sama di tahun 2027 → harus sukses
    $response = $this->actingAs($this->admin)
        ->post(route('super-admin.keuangan.master-anggaran.program.store'), [
            'kode' => '139.03.DK',
            'nama' => 'Program 2027',
            'pagu' => 2000000,
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect(DjaProgram::where('kode', '139.03.DK')->count())->toBe(2);
    expect(DjaProgram::where('kode', '139.03.DK')->where('tahun_anggaran', '2027')->exists())->toBeTrue();
});

it('prevents creating duplicate program kode within same tahun_anggaran', function () {
    DjaProgram::create([
        'tahun_anggaran' => '2026',
        'kode' => '139.03.DK',
        'nama' => 'Program 2026',
        'pagu' => 1000000,
        'is_aktif' => true,
    ]);

    setTahunSession($this->tahun2026);

    // Coba buat lagi kode sama di tahun 2026 → harus ditolak
    $response = $this->actingAs($this->admin)
        ->post(route('super-admin.keuangan.master-anggaran.program.store'), [
            'kode' => '139.03.DK',
            'nama' => 'Program 2026 Duplikat',
            'pagu' => 2000000,
        ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('kode');
    expect(DjaProgram::where('kode', '139.03.DK')->count())->toBe(1);
});

// ─── Program Update ────────────────────────────────────────────────────────────

it('allows updating program kode to another kode used in different tahun', function () {
    DjaProgram::create([
        'tahun_anggaran' => '2026',
        'kode' => '139.03.DK',
        'nama' => 'Program 2026',
        'pagu' => 1000000,
        'is_aktif' => true,
    ]);

    $program2027 = DjaProgram::create([
        'tahun_anggaran' => '2027',
        'kode' => '139.04.DK',
        'nama' => 'Program 2027',
        'pagu' => 2000000,
        'is_aktif' => true,
    ]);

    setTahunSession($this->tahun2027);

    // Update program 2027 jadi kode 139.03.DK → OK karena 139.03.DK belum ada di 2027
    $response = $this->actingAs($this->admin)
        ->put(route('super-admin.keuangan.master-anggaran.program.update', $program2027), [
            'kode' => '139.03.DK',
            'nama' => 'Program 2027 Updated',
            'pagu' => 2500000,
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');
    expect(DjaProgram::where('kode', '139.03.DK')->where('tahun_anggaran', '2027')->exists())->toBeTrue();
});

it('prevents updating program kode to duplicate within same tahun_anggaran', function () {
    $program1 = DjaProgram::create([
        'tahun_anggaran' => '2026',
        'kode' => '139.03.DK',
        'nama' => 'Program A',
        'pagu' => 1000000,
        'is_aktif' => true,
    ]);

    DjaProgram::create([
        'tahun_anggaran' => '2026',
        'kode' => '139.04.DK',
        'nama' => 'Program B',
        'pagu' => 2000000,
        'is_aktif' => true,
    ]);

    setTahunSession($this->tahun2026);

    // Update program 1 jadi kode yang sudah ada di tahun 2026
    $response = $this->actingAs($this->admin)
        ->put(route('super-admin.keuangan.master-anggaran.program.update', $program1), [
            'kode' => '139.04.DK',
            'nama' => 'Program A Updated',
            'pagu' => 1500000,
        ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('kode');
});

// ─── DJA Index / PUMK Dropdown Scope ─────────────────────────────────────────

it('scopes dja index to current tahun_anggaran session', function () {
    DjaProgram::create([
        'tahun_anggaran' => '2026',
        'kode' => '139.03.DK',
        'nama' => 'Program 2026',
        'pagu' => 1000000,
        'is_aktif' => true,
    ]);

    DjaProgram::create([
        'tahun_anggaran' => '2027',
        'kode' => '139.03.DK',
        'nama' => 'Program 2027',
        'pagu' => 2000000,
        'is_aktif' => true,
    ]);

    setTahunSession($this->tahun2026);

    $response = $this->actingAs($this->admin)
        ->get(route('super-admin.keuangan.master-anggaran.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('programs', 1)
        ->where('programs.0.nama', 'Program 2026')
    );
});
