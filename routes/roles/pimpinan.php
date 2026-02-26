<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Pimpinan\DashboardController;

Route::prefix('pimpinan')->middleware('role:pimpinan')->name('pimpinan.')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/approval', fn() => Inertia::render('Pimpinan/Approval'))->name('approval');
    Route::get('/validasi', fn() => Inertia::render('Pimpinan/Validasi'))->name('validasi');
    Route::get('/laporan', fn() => Inertia::render('Pimpinan/Laporan'))->name('laporan');
});
