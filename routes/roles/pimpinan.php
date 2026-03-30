<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Pimpinan\DashboardController;
use App\Http\Controllers\Pimpinan\PerencanaanController;
use App\Http\Controllers\Pimpinan\PermohonanDanaController;

Route::prefix('pimpinan')->middleware('role:pimpinan')->name('pimpinan.')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/approval', fn() => Inertia::render('Pimpinan/Approval'))->name('approval');
    Route::get('/validasi', fn() => Inertia::render('Pimpinan/Validasi'))->name('validasi');
    Route::get('/laporan', fn() => Inertia::render('Pimpinan/Laporan'))->name('laporan');

    // ─── Perencanaan ─────────────────────────────────────────────────────────────
    Route::prefix('perencanaan')->name('perencanaan.')->group(function () {

        // PK Awal
        Route::get('/perjanjian-kinerja/awal', [PerencanaanController::class, 'pkAwal'])->name('pk.awal');
        Route::post('/perjanjian-kinerja/{pk}/approve', [PerencanaanController::class, 'pkApprove'])->name('pk.approve');
        Route::post('/perjanjian-kinerja/{pk}/reject', [PerencanaanController::class, 'pkReject'])->name('pk.reject');

        // PK Revisi
        Route::get('/perjanjian-kinerja/revisi', [PerencanaanController::class, 'pkRevisi'])->name('pk.revisi');

        // Rencana Aksi
        Route::get('/rencana-aksi', [PerencanaanController::class, 'rencanaAksi'])->name('ra');
        Route::post('/rencana-aksi/{ra}/approve', [PerencanaanController::class, 'raApprove'])->name('ra.approve');
        Route::post('/rencana-aksi/{ra}/reject', [PerencanaanController::class, 'raReject'])->name('ra.reject');
    });

    // ─── Keuangan ─────────────────────────────────────────────────────────────────
    Route::prefix('keuangan')->name('keuangan.')->group(function () {
        Route::prefix('permohonan-dana')->name('permohonan-dana.')->group(function () {
            Route::get('/',              [PermohonanDanaController::class, 'index'])->name('index');
            Route::post('/{pd}/approve', [PermohonanDanaController::class, 'approve'])->name('approve');
            Route::post('/{pd}/reject',  [PermohonanDanaController::class, 'reject'])->name('reject');
        });
    });
});
