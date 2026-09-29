<?php

use App\Models\IndikatorKinerja;
use App\Models\PeriodePengukuran;
use App\Models\PerjanjianKinerja;
use App\Models\Sasaran;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;

test('tidak menyimpan pengukuran jika realisasi kosong', function () {
    $tahun = TahunAnggaran::create([
        'tahun' => 2026,
        'label' => 'TA 2026',
        'is_active' => true,
        'is_default' => true,
    ]);

    $timKerja = TimKerja::create([
        'nama' => 'Tim Pengujian Pengukuran',
        'kode' => 'TK-UJI',
        'nama_singkat' => 'UJI',
        'is_active' => true,
    ]);

    $user = User::create([
        'nama_lengkap' => 'Ketua Tim Pengujian',
        'username' => 'ketua-pengukuran-uji',
        'email' => 'ketua-pengukuran-uji@example.test',
        'password' => 'password',
        'role' => 'ketua_tim_kerja',
        'tim_kerja_id' => $timKerja->id,
        'is_active' => true,
    ]);

    $periode = PeriodePengukuran::create([
        'tahun_anggaran_id' => $tahun->id,
        'triwulan' => 'TW3',
        'is_active' => true,
    ]);

    $pk = PerjanjianKinerja::create([
        'tahun_anggaran_id' => $tahun->id,
        'tim_kerja_id' => $timKerja->id,
        'jenis' => 'awal',
        'status' => 'draft',
        'created_by' => $user->id,
    ]);

    $sasaran = Sasaran::create([
        'perjanjian_kinerja_id' => $pk->id,
        'kode' => 'S 1',
        'nama' => 'Sasaran Pengujian',
        'urutan' => 1,
    ]);

    $indikator = $sasaran->indikators()->create([
        'kode' => 'IKU UJI 1',
        'nama' => 'Indikator Pengujian',
        'satuan' => '%',
        'target' => '100',
        'target_tw3' => '25',
        'urutan' => 1,
    ]);
    $indikator->picTimKerjas()->attach($timKerja->id);

    $this->actingAs($user)
        ->post(route('ketua-tim.pengukuran.store'), [
            'indikator_kinerja_id' => $indikator->id,
            'periode_pengukuran_id' => $periode->id,
            'realisasi' => '   ',
            'progress_kegiatan' => '',
            'kendala' => '',
            'strategi_tindak_lanjut' => '',
            'catatan' => '',
        ])
        ->assertSessionHasErrors('realisasi');

    $this->assertDatabaseMissing('realisasi_kinerja', [
        'indikator_kinerja_id' => $indikator->id,
        'periode_pengukuran_id' => $periode->id,
    ]);
});
