<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('bendahara')->middleware('role:bendahara')->name('bendahara.')->group(function () {

    Route::get('/dashboard', fn() => Inertia::render('Bendahara/Dashboard'))->name('dashboard');
    Route::get('/pencairan', fn() => Inertia::render('Bendahara/Pencairan'))->name('pencairan');
    Route::get('/verifikasi-lpj', fn() => Inertia::render('Bendahara/VerifikasiLPJ'))->name('verifikasi-lpj');
    Route::get('/laporan', fn() => Inertia::render('Bendahara/Laporan'))->name('laporan');
});
