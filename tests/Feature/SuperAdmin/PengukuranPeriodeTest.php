<?php

use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\RealisasiKinerja;
use App\Models\Sasaran;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use PhpOffice\PhpSpreadsheet\IOFactory;

function superAdminUser(): User
{
    return User::create([
        'nama_lengkap' => 'Super Admin Test',
        'username' => 'superadmin-test',
        'email' => 'superadmin-test@example.test',
        'password' => 'password',
        'role' => 'super_admin',
        'is_active' => true,
    ]);
}

function defaultTahunAnggaran(): TahunAnggaran
{
    return TahunAnggaran::create([
        'tahun' => 2026,
        'label' => 'TA 2026',
        'is_active' => true,
        'is_default' => true,
    ]);
}

test('menyimpan periode triwulan yang dipilih tanpa mengubah TW1', function () {
    $tahun = defaultTahunAnggaran();
    $this->actingAs(superAdminUser());

    $tw1 = PeriodePengukuran::create([
        'tahun_anggaran_id' => $tahun->id,
        'triwulan' => 'TW1',
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-03-31 16:59:59',
        'is_active' => false,
    ]);

    $this->post(route('super-admin.pengukuran.periode.store'), [
        'triwulan' => 'TW2',
        'tanggal_mulai' => '2026-04-01',
        'tanggal_selesai' => '2026-06-30T15:30',
    ])->assertRedirect();

    expect($tw1->fresh()->tanggal_selesai->format('Y-m-d H:i:s'))
        ->toBe('2026-03-31 16:59:59');

    $tw2 = PeriodePengukuran::where('tahun_anggaran_id', $tahun->id)
        ->where('triwulan', 'TW2')
        ->firstOrFail();

    expect($tw2->tanggal_mulai->format('Y-m-d'))->toBe('2026-04-01')
        ->and($tw2->tanggal_selesai->timezone('Asia/Jakarta')->format('Y-m-d H:i:s'))->toBe('2026-06-30 15:30:00');
});

test('membuka satu periode menutup periode lain pada tahun yang sama', function () {
    $tahun = defaultTahunAnggaran();
    $this->actingAs(superAdminUser());

    $tw1 = PeriodePengukuran::create([
        'tahun_anggaran_id' => $tahun->id,
        'triwulan' => 'TW1',
        'is_active' => true,
    ]);

    $tw2 = PeriodePengukuran::create([
        'tahun_anggaran_id' => $tahun->id,
        'triwulan' => 'TW2',
        'is_active' => false,
    ]);

    $this->patch(route('super-admin.pengukuran.periode.toggle', $tw2))
        ->assertRedirect();

    expect($tw1->fresh()->is_active)->toBeFalse()
        ->and($tw2->fresh()->is_active)->toBeTrue();
});

test('capaian kinerja tetap menampilkan periode yang sudah ditutup sebagai histori', function () {
    $tahun = defaultTahunAnggaran();
    $this->actingAs(superAdminUser());

    $tw1 = PeriodePengukuran::create([
        'tahun_anggaran_id' => $tahun->id,
        'triwulan' => 'TW1',
        'is_active' => false,
    ]);

    $tw2 = PeriodePengukuran::create([
        'tahun_anggaran_id' => $tahun->id,
        'triwulan' => 'TW2',
        'is_active' => true,
    ]);

    $this->get(route('super-admin.pengukuran.realisasi'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/Pengukuran/Realisasi')
            ->has('periodes', 2)
            ->where('periode.id', $tw2->id)
            ->where('periodes.0.id', $tw1->id)
            ->where('periodes.0.is_active', false)
            ->where('periodes.1.id', $tw2->id)
            ->where('periodes.1.is_active', true)
        );

    $this->get(route('super-admin.pengukuran.realisasi', ['periode_id' => $tw1->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/Pengukuran/Realisasi')
            ->where('periode.id', $tw1->id)
            ->where('periode.is_active', false)
        );
});

test('export xlsx capaian kinerja memuat isian progress kendala dan strategi tindak lanjut', function () {
    $tahun = defaultTahunAnggaran();
    $superAdmin = superAdminUser();
    $this->actingAs($superAdmin);

    $timKerja = TimKerja::create([
        'nama' => 'Tim Kerja Pengujian',
        'kode' => 'TK-TST',
        'nama_singkat' => 'TST',
        'is_active' => true,
    ]);

    $periode = PeriodePengukuran::create([
        'tahun_anggaran_id' => $tahun->id,
        'triwulan' => 'TW1',
        'is_active' => true,
    ]);

    $pk = PerjanjianKinerja::create([
        'tahun_anggaran_id' => $tahun->id,
        'tim_kerja_id' => $timKerja->id,
        'jenis' => 'awal',
        'status' => 'draft',
        'created_by' => $superAdmin->id,
    ]);

    $sasaran = Sasaran::create([
        'perjanjian_kinerja_id' => $pk->id,
        'kode' => 'S 1',
        'nama' => 'Sasaran Pengujian',
        'urutan' => 1,
    ]);

    $indikator = $sasaran->indikators()->create([
        'kode' => 'IKU 1.1',
        'nama' => 'Indikator Pengujian',
        'satuan' => '%',
        'target' => '100',
        'target_tw1' => '25',
        'urutan' => 1,
    ]);
    $indikator->picTimKerjas()->attach($timKerja->id);

    RealisasiKinerja::create([
        'indikator_kinerja_id' => $indikator->id,
        'periode_pengukuran_id' => $periode->id,
        'input_by_tim_kerja_id' => $timKerja->id,
        'realisasi' => '20',
        'progress_kegiatan' => 'Progress kegiatan TW1 sudah berjalan',
        'kendala' => 'Kendala koordinasi lintas unit',
        'strategi_tindak_lanjut' => 'Strategi tindak lanjut rapat mingguan',
        'created_by' => $superAdmin->id,
    ]);

    $response = $this->get(route('super-admin.pengukuran.export.xls'));
    $response->assertOk();

    $tmpPath = tempnam(sys_get_temp_dir(), 'pengukuran-export-').'.xlsx';
    file_put_contents($tmpPath, $response->streamedContent());

    $workbook = IOFactory::load($tmpPath);
    unlink($tmpPath);

    $mainValues = collect($workbook->getSheetByName('Capaian Kinerja')->toArray())->flatten()->filter()->values();
    $detailValues = collect($workbook->getSheetByName('Detail TW I')->toArray())->flatten()->filter()->values();

    expect($mainValues)->not->toContain('Progress/Kegiatan')
        ->and($mainValues)->not->toContain('Kendala/Permasalahan')
        ->and($mainValues)->not->toContain('Strategi/Tindak Lanjut')
        ->and($detailValues)->toContain('Progress/Kegiatan')
        ->and($detailValues)->toContain('Kendala/Permasalahan')
        ->and($detailValues)->toContain('Strategi/Tindak Lanjut')
        ->and($detailValues)->toContain('Progress kegiatan TW1 sudah berjalan')
        ->and($detailValues)->toContain('Kendala koordinasi lintas unit')
        ->and($detailValues)->toContain('Strategi tindak lanjut rapat mingguan');
});
