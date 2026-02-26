<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;

// ========================================
// PUBLIC ROUTES
// ========================================
Route::get('/', fn() => redirect()->route('login'))->name('home');

// ========================================
// AUTHENTICATED ROUTES
// ========================================
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'redirect'])->name('dashboard');

    require __DIR__.'/roles/super-admin.php';
    require __DIR__.'/roles/ketua-tim.php';
    require __DIR__.'/roles/pimpinan.php';
    require __DIR__.'/roles/bendahara.php';
});

require __DIR__.'/settings.php';
