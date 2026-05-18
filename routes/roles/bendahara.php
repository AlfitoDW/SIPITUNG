<?php

use App\Http\Controllers\Bendahara\DashboardController;
use App\Http\Controllers\Bendahara\PermohonanDanaController;
use Illuminate\Support\Facades\Route;

Route::prefix('bendahara')->middleware('role:bendahara')->name('bendahara.')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/laporan', fn () => \Inertia\Inertia::render('Bendahara/Laporan'))->name('laporan');
    Route::get('/verifikasi-lpj', fn () => \Inertia\Inertia::render('Bendahara/VerifikasiLPJ'))->name('verifikasi-lpj');

    // ─── Permohonan Dana — Pencairan (step 5) ────────────────────────────────────
    Route::prefix('permohonan-dana')->name('permohonan-dana.')->group(function () {
        Route::get('/', [PermohonanDanaController::class, 'index'])->name('index');
        Route::get('/{pd}', [PermohonanDanaController::class, 'show'])->name('show');
        Route::get('/{pd}/print', [PermohonanDanaController::class, 'print'])->name('print');
        Route::post('/{pd}/setujui', [PermohonanDanaController::class, 'setujui'])->name('setujui');
        Route::post('/{pd}/reject', [PermohonanDanaController::class, 'reject'])->name('reject');
        Route::post('/{pd}/upload-bukti-bayar', [PermohonanDanaController::class, 'uploadBuktiBayar'])->name('upload-bukti-bayar');
        Route::post('/{pd}/hapus-bukti-bayar', [PermohonanDanaController::class, 'hapusBuktiBayar'])->name('hapus-bukti-bayar');
        Route::post('/{pd}/buka-kunci', [PermohonanDanaController::class, 'bukaKunci'])->name('buka-kunci');
        Route::get('/{pd}/nominatif', [PermohonanDanaController::class, 'nominatif'])->name('nominatif');
    });
});
