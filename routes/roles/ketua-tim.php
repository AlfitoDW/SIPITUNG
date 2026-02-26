<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\KetuaTim\DashboardController;

Route::prefix('ketua-tim')->middleware('role:ketua_tim_kerja')->name('ketua-tim.')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/perencanaan', fn() => Inertia::render('KetuaTim/Perencanaan'))->name('perencanaan');

    Route::prefix('perencanaan/perjanjian-kinerja')->name('perencanaan.pk.')->group(function () {
        Route::get('awal/persiapan', fn() => Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Awal/Persiapan'))->name('awal.persiapan');
        Route::get('awal/progress', fn() => Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Awal/Progress'))->name('awal.progress');
        Route::get('revisi/persiapan', fn() => Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Revisi/Persiapan'))->name('revisi.persiapan');
        Route::get('revisi/progress', fn() => Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Revisi/Progress'))->name('revisi.progress');
    });

    Route::prefix('perencanaan/rencana-aksi')->name('perencanaan.ra.')->group(function () {
        Route::get('awal/persiapan', fn() => Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Awal/Persiapan'))->name('awal.persiapan');
        Route::get('awal/progress', fn() => Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Awal/Progress'))->name('awal.progress');
        Route::get('revisi/persiapan', fn() => Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Revisi/Persiapan'))->name('revisi.persiapan');
        Route::get('revisi/progress', fn() => Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Revisi/Progress'))->name('revisi.progress');
    });

    Route::get('/permohonan-dana', fn() => Inertia::render('KetuaTim/PermohonanDana'))->name('permohonan-dana');
    Route::get('/lpj', fn() => Inertia::render('KetuaTim/LPJ'))->name('lpj');
    Route::get('/dokumen', fn() => Inertia::render('KetuaTim/Dokumen'))->name('dokumen');
});
