<?php

use App\Http\Controllers\KetuaTim\PerencanaanController;
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

    // Sasaran & Indikator — shared untuk PK Awal & Revisi
    Route::prefix('perencanaan')->name('perencanaan.')->group(function () {
        Route::post('sasaran', [PerencanaanController::class, 'sasaranStore'])->name('sasaran.store');
        Route::put('sasaran/{sasaran}', [PerencanaanController::class, 'sasaranUpdate'])->name('sasaran.update');
        Route::delete('sasaran/{sasaran}', [PerencanaanController::class, 'sasaranDestroy'])->name('sasaran.destroy');

        Route::post('indikator', [PerencanaanController::class, 'indikatorStore'])->name('indikator.store');
        Route::put('indikator/{indikator}', [PerencanaanController::class, 'indikatorUpdate'])->name('indikator.update');
        Route::delete('indikator/{indikator}', [PerencanaanController::class, 'indikatorDestroy'])->name('indikator.destroy');
    });

    Route::prefix('perencanaan/rencana-aksi')->name('perencanaan.ra.')->group(function () {
        Route::get('penyusunan', [PerencanaanController::class, 'rencanaAksi'])->name('penyusunan');
        Route::get('progress', [PerencanaanController::class, 'rencanaAksiProgress'])->name('progress');
        Route::post('init', [PerencanaanController::class, 'raInit'])->name('init');
        Route::put('indikator/{indikator}', [PerencanaanController::class, 'raIndikatorUpdate'])->name('indikator.update');
        Route::delete('indikator/{indikator}', [PerencanaanController::class, 'raIndikatorDestroy'])->name('indikator.destroy');
        Route::post('indikator', [PerencanaanController::class, 'raIndikatorStore'])->name('indikator.store');
        Route::patch('submit', [PerencanaanController::class, 'raSubmit'])->name('submit');
    });

    Route::get('/permohonan-dana', fn() => Inertia::render('KetuaTim/PermohonanDana'))->name('permohonan-dana');
    Route::get('/lpj', fn() => Inertia::render('KetuaTim/LPJ'))->name('lpj');
    Route::get('/dokumen', fn() => Inertia::render('KetuaTim/Dokumen'))->name('dokumen');
});
