<?php

use App\Http\Controllers\Pumk\DashboardController;
use App\Http\Controllers\Pumk\NominatifController;
use App\Http\Controllers\Pumk\PermohonanDanaController;
use Illuminate\Support\Facades\Route;

Route::prefix('pumk')->middleware('role:pumk')->name('pumk.')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ─── Permohonan Dana ──────────────────────────────────────────────────────────
    Route::prefix('permohonan-dana')->name('permohonan-dana.')->group(function () {
        Route::get('/', [PermohonanDanaController::class, 'index'])->name('index');
        Route::get('/buat', [PermohonanDanaController::class, 'create'])->name('create');
        Route::post('/', [PermohonanDanaController::class, 'store'])->name('store');
        Route::delete('/{pd}', [PermohonanDanaController::class, 'destroy'])->name('destroy');
        Route::patch('/{pd}/submit', [PermohonanDanaController::class, 'submit'])->name('submit');

        // Wizard
        Route::get('/{pd}/wizard', [PermohonanDanaController::class, 'wizard'])->name('wizard');
        Route::patch('/{pd}/step2', [PermohonanDanaController::class, 'updateStep2'])->name('step2');
        Route::post('/{pd}/dokumen', [PermohonanDanaController::class, 'uploadDokumen'])->name('dokumen.upload');
        Route::delete('/{pd}/dokumen/{dokumen}', [PermohonanDanaController::class, 'hapusDokumen'])->name('dokumen.hapus');
        Route::patch('/{pd}/step4', [PermohonanDanaController::class, 'updateStep4'])->name('step4');

        // Print Preview
        Route::get('/{pd}/print', [PermohonanDanaController::class, 'print'])->name('print');

        // Nominatif
        Route::get('/{pd}/nominatif', [NominatifController::class, 'index'])->name('nominatif');
        Route::post('/{pd}/nominatif/simpan', [NominatifController::class, 'store'])->name('nominatif.store');

        // Cascading dropdown APIs
        Route::get('/api/sasaran', [PermohonanDanaController::class, 'getSasaran'])->name('api.sasaran');
        Route::get('/api/kro', [PermohonanDanaController::class, 'getKro'])->name('api.kro');
        Route::get('/api/ro', [PermohonanDanaController::class, 'getRo'])->name('api.ro');
        Route::get('/api/komponen', [PermohonanDanaController::class, 'getKomponen'])->name('api.komponen');
        Route::get('/api/kegiatan', [PermohonanDanaController::class, 'getKegiatan'])->name('api.kegiatan');
    });

    // Ref Pegawai
    Route::get('/ref-pegawai/search', [NominatifController::class, 'searchPegawai'])->name('ref-pegawai.search');
    Route::post('/ref-pegawai', [NominatifController::class, 'storeRefNama'])->name('ref-pegawai.store');
});
