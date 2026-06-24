<?php

use App\Http\Controllers\PicKeuangan\DashboardController;
use App\Http\Controllers\PicKeuangan\PermohonanDanaController;
use Illuminate\Support\Facades\Route;

Route::prefix('pic-keuangan')->middleware('role:pic_keuangan')->name('pic-keuangan.')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/verifikasi-lpj', [DashboardController::class, 'verifikasiLpj'])->name('verifikasi-lpj');

    // ─── Permohonan Dana — Verifikasi (step 4) ────────────────────────────────────
    Route::prefix('permohonan-dana')->name('permohonan-dana.')->group(function () {
        Route::get('/', [PermohonanDanaController::class, 'index'])->name('index');
        Route::get('/{pd}', [PermohonanDanaController::class, 'show'])->name('show');
        Route::get('/{pd}/print', [PermohonanDanaController::class, 'print'])->name('print');
        Route::post('/{pd}/approve', [PermohonanDanaController::class, 'approve'])->name('approve');
        Route::post('/{pd}/reject', [PermohonanDanaController::class, 'reject'])->name('reject');
        Route::get('/{pd}/nominatif', [PermohonanDanaController::class, 'nominatif'])->name('nominatif');
    });
});
