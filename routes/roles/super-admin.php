<?php

use App\Http\Controllers\SuperAdmin\DashboardController as SuperAdminDashboard;
use App\Http\Controllers\SuperAdmin\DataMasterController;
use App\Http\Controllers\SuperAdmin\KeuanganController;
use App\Http\Controllers\SuperAdmin\PengukuranController;
use App\Http\Controllers\SuperAdmin\PerencanaanController;
use App\Http\Controllers\SuperAdmin\TahunAnggaranController;
use App\Http\Controllers\SuperAdmin\TimKerjaController;
use App\Http\Controllers\SuperAdmin\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('super-admin')->middleware('role:super_admin')->name('super-admin.')->group(function () {

    Route::get('/dashboard', [SuperAdminDashboard::class, 'index'])->name('dashboard');

    Route::prefix('keuangan')->name('keuangan.')->group(function () {
        Route::get('permohonan-dana', [KeuanganController::class, 'permohonanDana'])->name('permohonan-dana');
        Route::get('pencairan-dana', [KeuanganController::class, 'pencairanDana'])->name('pencairan-dana');
    });
    Route::get('/perencanaan', fn () => Inertia::render('SuperAdmin/Perencanaan'))->name('perencanaan');

    Route::prefix('perencanaan/perjanjian-kinerja')->name('perencanaan.pk.')->group(function () {
        Route::get('awal/penyusunan', [PerencanaanController::class, 'pkAwal'])->name('awal.penyusunan');
        Route::get('awal/progress', fn () => Inertia::render('SuperAdmin/Perencanaan/PerjanjianKinerja/Awal/Progress'))->name('awal.progress');
        Route::get('revisi/penyusunan', [PerencanaanController::class, 'pkRevisi'])->name('revisi.penyusunan');
        Route::get('revisi/progress', fn () => Inertia::render('SuperAdmin/Perencanaan/PerjanjianKinerja/Revisi/Progress'))->name('revisi.progress');
        Route::get('matriks', [PerencanaanController::class, 'matriksPK'])->name('matriks');

        Route::patch('{pk}/reopen', [PerencanaanController::class, 'pkReopen'])->name('reopen');
    });

    // SuperAdmin CRUD: Sasaran & Indikator (drafting terpusat)
    Route::prefix('perencanaan')->name('perencanaan.')->group(function () {
        Route::post('sasaran', [PerencanaanController::class, 'sasaranStore'])->name('sasaran.store');
        Route::put('sasaran/{sasaran}', [PerencanaanController::class, 'sasaranUpdate'])->name('sasaran.update');
        Route::delete('sasaran/{sasaran}', [PerencanaanController::class, 'sasaranDestroy'])->name('sasaran.destroy');

        Route::post('master-sasaran', [PerencanaanController::class, 'masterSasaranStore'])->name('master_sasaran.store');
        Route::put('master-sasaran/{masterSasaran}', [PerencanaanController::class, 'masterSasaranUpdate'])->name('master_sasaran.update');
        Route::delete('master-sasaran/{masterSasaran}', [PerencanaanController::class, 'masterSasaranDestroy'])->name('master_sasaran.destroy');

        Route::post('indikator', [PerencanaanController::class, 'indikatorStore'])->name('indikator.store');
        Route::put('indikator/{indikator}', [PerencanaanController::class, 'indikatorUpdate'])->name('indikator.update');
        Route::delete('indikator/{indikator}', [PerencanaanController::class, 'indikatorDestroy'])->name('indikator.destroy');
        Route::patch('indikator/{indikator}/pic', [PerencanaanController::class, 'indikatorUpdatePic'])->name('indikator.pic');
    });

    Route::prefix('perencanaan/rencana-aksi')->name('perencanaan.ra.')->group(function () {
        Route::get('penyusunan', [PerencanaanController::class, 'rencanaAksi'])->name('penyusunan');
        Route::get('progress', fn () => Inertia::render('SuperAdmin/Perencanaan/RencanaAksi/Progress'))->name('progress');

        Route::patch('batas', [PerencanaanController::class, 'raBatasUpdate'])->name('batas.update');
        Route::patch('{ra}/reopen', [PerencanaanController::class, 'raReopen'])->name('reopen');
    });

    // Pengukuran Kinerja
    Route::prefix('pengukuran')->name('pengukuran.')->group(function () {
        Route::get('/', [PengukuranController::class, 'index'])->name('index');
        Route::post('periode', [PengukuranController::class, 'periodeStore'])->name('periode.store');
        Route::patch('periode/{periode}/toggle', [PengukuranController::class, 'periodeToggle'])->name('periode.toggle');
        Route::get('realisasi', [PengukuranController::class, 'realisasi'])->name('realisasi');
        Route::get('export/xls', [PengukuranController::class, 'exportXls'])->name('export.xls');
        Route::get('export/pdf', [PengukuranController::class, 'exportPdf'])->name('export.pdf');
        Route::get('export/tw-pdf', [PengukuranController::class, 'exportTwPdf'])->name('export.tw-pdf');
        Route::patch('laporan/{laporan}/reopen', [PengukuranController::class, 'laporanReopen'])->name('laporan.reopen');
    });

    Route::get('/pertanggungjawaban', fn () => Inertia::render('SuperAdmin/Pertanggungjawaban'))->name('pertanggungjawaban');
    Route::get('/validasi', fn () => Inertia::render('SuperAdmin/Validasi'))->name('validasi');
    Route::get('/dokumen', fn () => Inertia::render('SuperAdmin/Dokumen'))->name('dokumen');
    Route::get('/laporan', fn () => Inertia::render('SuperAdmin/Laporan'))->name('laporan');
    Route::get('/notifikasi', fn () => Inertia::render('SuperAdmin/Notifikasi'))->name('notifikasi');
    Route::get('/kelola-pengguna', fn () => Inertia::render('SuperAdmin/KelolaPengguna'))->name('kelola-pengguna');
    Route::get('/backup-data', fn () => Inertia::render('SuperAdmin/BackupData'))->name('backup-data');

    Route::get('/data-master', [DataMasterController::class, 'index'])->name('data-master');

    // Master Tim Kerja
    Route::prefix('master/tim-kerja')->name('master.tim-kerja.')->group(function () {
        Route::get('/', [TimKerjaController::class, 'index'])->name('index');
        Route::post('/', [TimKerjaController::class, 'store'])->name('store');
        Route::put('/{timKerja}', [TimKerjaController::class, 'update'])->name('update');
        Route::delete('/{timKerja}', [TimKerjaController::class, 'destroy'])->name('destroy');
        Route::patch('/{timKerja}/toggle-active', [TimKerjaController::class, 'toggleActive'])->name('toggle-active');
    });
    Route::apiResource('data-master/users', UserController::class)
        ->only(['store', 'update', 'destroy']);
    Route::patch('/data-master/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('data-master.users.toggle-status');
    Route::patch('/data-master/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('data-master.users.reset-password');
    Route::apiResource('data-master/tahun-anggaran', TahunAnggaranController::class)
        ->only(['store', 'update', 'destroy']);
    Route::patch('/data-master/tahun-anggaran/{tahunAnggaran}/toggle-default', [TahunAnggaranController::class, 'toggleDefault'])
        ->name('data-master.tahun-anggaran.toggle-default');
});
