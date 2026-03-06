<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SuperAdmin\UserController;
use App\Http\Controllers\SuperAdmin\DataMasterController;
use App\Http\Controllers\SuperAdmin\PerencanaanController;
use App\Http\Controllers\SuperAdmin\TahunAnggaranController;

Route::prefix('super-admin')->middleware('role:super_admin')->name('super-admin.')->group(function () {

    Route::get('/dashboard', fn() => Inertia::render('SuperAdmin/Dashboard'))->name('dashboard');
    Route::get('/keuangan', fn() => Inertia::render('SuperAdmin/Keuangan'))->name('keuangan');
    Route::get('/perencanaan', fn() => Inertia::render('SuperAdmin/Perencanaan'))->name('perencanaan');

    Route::prefix('perencanaan/perjanjian-kinerja')->name('perencanaan.pk.')->group(function () {
        Route::get('awal/penyusunan', [PerencanaanController::class, 'pkAwal'])->name('awal.penyusunan');
        Route::get('awal/progress', fn() => Inertia::render('SuperAdmin/Perencanaan/PerjanjianKinerja/Awal/Progress'))->name('awal.progress');
        Route::get('revisi/penyusunan', [PerencanaanController::class, 'pkRevisi'])->name('revisi.penyusunan');
        Route::get('revisi/progress', fn() => Inertia::render('SuperAdmin/Perencanaan/PerjanjianKinerja/Revisi/Progress'))->name('revisi.progress');

        Route::patch('{pk}/reopen', [PerencanaanController::class, 'pkReopen'])->name('reopen');
    });

    Route::prefix('perencanaan/rencana-aksi')->name('perencanaan.ra.')->group(function () {
        Route::get('penyusunan', [PerencanaanController::class, 'rencanaAksi'])->name('penyusunan');
        Route::get('progress', fn() => Inertia::render('SuperAdmin/Perencanaan/RencanaAksi/Progress'))->name('progress');

        Route::patch('{ra}/reopen', [PerencanaanController::class, 'raReopen'])->name('reopen');
    });

    Route::get('/pertanggungjawaban', fn() => Inertia::render('SuperAdmin/Pertanggungjawaban'))->name('pertanggungjawaban');
    Route::get('/validasi', fn() => Inertia::render('SuperAdmin/Validasi'))->name('validasi');
    Route::get('/dokumen', fn() => Inertia::render('SuperAdmin/Dokumen'))->name('dokumen');
    Route::get('/laporan', fn() => Inertia::render('SuperAdmin/Laporan'))->name('laporan');
    Route::get('/notifikasi', fn() => Inertia::render('SuperAdmin/Notifikasi'))->name('notifikasi');
    Route::get('/kelola-pengguna', fn() => Inertia::render('SuperAdmin/KelolaPengguna'))->name('kelola-pengguna');
    Route::get('/backup-data', fn() => Inertia::render('SuperAdmin/BackupData'))->name('backup-data');

    Route::get('/data-master', [DataMasterController::class, 'index'])->name('data-master');
    Route::apiResource('data-master/users', UserController::class)
        ->only(['store', 'update', 'destroy']);
    Route::patch('/data-master/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('data-master.users.toggle-status');
    Route::patch('/data-master/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('data-master.users.reset-password');
    Route::apiResource('data-master/tahun-anggaran', TahunAnggaranController::class)
        ->only(['store', 'update', 'destroy']);
    Route::patch('/data-master/tahun-anggaran/{tahunAnggaran}/toggle-default', [TahunAnggaranController::class,'toggleDefault'])
      ->name('data-master.tahun-anggaran.toggle-default');
});
