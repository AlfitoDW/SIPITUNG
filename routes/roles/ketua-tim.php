<?php

use App\Http\Controllers\KetuaTim\PerencanaanController;
use App\Http\Controllers\KetuaTim\PengukuranController;
use App\Http\Controllers\KetuaTim\PermohonanDanaController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\KetuaTim\DashboardController;

Route::prefix('ketua-tim')->middleware('role:ketua_tim_kerja')->name('ketua-tim.')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/perencanaan', fn() => Inertia::render('KetuaTim/Perencanaan'))->name('perencanaan');

    Route::prefix('perencanaan/perjanjian-kinerja')->name('perencanaan.pk.')->group(function () {
        // PK Awal — view + CRUD
        Route::get('awal/persiapan', [PerencanaanController::class, 'pkAwal'])->name('awal.persiapan');
        Route::get('awal/progress', [PerencanaanController::class, 'pkAwalProgress'])->name('awal.progress');
        Route::post('awal/init', [PerencanaanController::class, 'pkAwalInit'])->name('awal.init');
        Route::patch('awal/submit', [PerencanaanController::class, 'pkAwalSubmit'])->name('awal.submit');

        // PK Revisi — view + CRUD
        Route::get('revisi/persiapan', [PerencanaanController::class, 'pkRevisi'])->name('revisi.persiapan');
        Route::get('revisi/progress', [PerencanaanController::class, 'pkRevisiProgress'])->name('revisi.progress');
        Route::post('revisi/init', [PerencanaanController::class, 'pkRevisiInit'])->name('revisi.init');
        Route::patch('revisi/submit', [PerencanaanController::class, 'pkRevisiSubmit'])->name('revisi.submit');
    });

    // Update target IKU di PK (hanya field target)
    Route::prefix('perencanaan')->name('perencanaan.')->group(function () {
        Route::patch('indikator/{indikator}/target', [PerencanaanController::class, 'indikatorTargetUpdate'])->name('indikator.target');
    });

    Route::prefix('perencanaan/rencana-aksi')->name('perencanaan.ra.')->group(function () {
        Route::get('penyusunan', [PerencanaanController::class, 'rencanaAksi'])->name('penyusunan');
        Route::get('progress', [PerencanaanController::class, 'rencanaAksiProgress'])->name('progress');
        Route::post('init', [PerencanaanController::class, 'raInit'])->name('init');
        // Update target + target_tw RA indikator (hanya field target)
        Route::patch('indikator/{indikator}/target', [PerencanaanController::class, 'raIndikatorUpdate'])->name('indikator.target');
        Route::patch('submit', [PerencanaanController::class, 'raSubmit'])->name('submit');
    });

    Route::prefix('permohonan-dana')->name('permohonan-dana.')->group(function () {
        Route::get('/',                [PermohonanDanaController::class, 'index'])->name('index');
        Route::get('/buat',            [PermohonanDanaController::class, 'create'])->name('create');
        Route::post('/',               [PermohonanDanaController::class, 'store'])->name('store');
        Route::get('/approval',        [PermohonanDanaController::class, 'approvalIndex'])->name('approval');
        Route::post('/{pd}/approve',   [PermohonanDanaController::class, 'approve'])->name('approve');
        Route::post('/{pd}/reject',    [PermohonanDanaController::class, 'reject'])->name('reject');
        Route::get('/{pd}/edit',       [PermohonanDanaController::class, 'edit'])->name('edit');
        Route::put('/{pd}',            [PermohonanDanaController::class, 'update'])->name('update');
        Route::delete('/{pd}',         [PermohonanDanaController::class, 'destroy'])->name('destroy');
        Route::patch('/{pd}/submit',   [PermohonanDanaController::class, 'submit'])->name('submit');
    });

    // Pengukuran Kinerja
    Route::prefix('pengukuran')->name('pengukuran.')->group(function () {
        Route::get('/',        [PengukuranController::class, 'index'])->name('index');
        Route::post('store',   [PengukuranController::class, 'store'])->name('store');
        Route::post('submit',  [PengukuranController::class, 'submit'])->name('submit');
    });

    Route::get('/lpj', fn() => Inertia::render('KetuaTim/LPJ'))->name('lpj');
    Route::get('/dokumen', fn() => Inertia::render('KetuaTim/Dokumen'))->name('dokumen');
    Route::get('/notifikasi', fn() => Inertia::render('KetuaTim/Notifikasi'))->name('notifikasi');
});
