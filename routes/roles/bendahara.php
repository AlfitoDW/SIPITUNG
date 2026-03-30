<?php

use App\Http\Controllers\Bendahara\PermohonanDanaController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('bendahara')->middleware('role:bendahara')->name('bendahara.')->group(function () {

    Route::get('/dashboard', fn() => Inertia::render('Bendahara/Dashboard'))->name('dashboard');
    Route::get('/laporan', fn() => Inertia::render('Bendahara/Laporan'))->name('laporan');
    Route::get('/verifikasi-lpj', fn() => Inertia::render('Bendahara/VerifikasiLPJ'))->name('verifikasi-lpj');

    // ─── Permohonan Dana ──────────────────────────────────────────────────────────
    Route::prefix('permohonan-dana')->name('permohonan-dana.')->group(function () {
        Route::get('/',               [PermohonanDanaController::class, 'index'])->name('index');
        Route::post('/{pd}/cek',      [PermohonanDanaController::class, 'cek'])->name('cek');
        Route::post('/{pd}/cairkan',  [PermohonanDanaController::class, 'cairkan'])->name('cairkan');
    });
});
