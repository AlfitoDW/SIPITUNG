<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// ========================================
// PUBLIC ROUTES
// ========================================
Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// ========================================
// AUTHENTICATED ROUTES
// ========================================
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Main dashboard - redirect based on role
    Route::get('/dashboard', function () {
        $user = auth()->user();
        
        if ($user->isSuperAdmin()) {
            return redirect()->route('super-admin.dashboard');
        } elseif ($user->isKetuaTimKerja()) {
            return redirect()->route('ketua-tim.dashboard');
        } elseif ($user->isPimpinan()) {
            return redirect()->route('pimpinan.dashboard');
        } elseif ($user->isBendahara()) {
            return redirect()->route('bendahara.dashboard');
        }
        
        abort(403, 'No dashboard available for your role');
    })->name('dashboard');

    // ========================================
    // SUPER ADMIN ROUTES
    // ========================================
    Route::prefix('super-admin')->middleware('role:super_admin')->name('super-admin.')->group(function () {
        
        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('SuperAdmin/Dashboard');
        })->name('dashboard');
        
        // Keuangan
        Route::get('/keuangan', function () {
            return Inertia::render('SuperAdmin/Keuangan');
        })->name('keuangan');
        
        // Perencanaan
        Route::get('/perencanaan', function () {
            return Inertia::render('SuperAdmin/Perencanaan');
        })->name('perencanaan');
        
        // Pertanggungjawaban (LPJ)
        Route::get('/pertanggungjawaban', function () {
            return Inertia::render('SuperAdmin/Pertanggungjawaban');
        })->name('pertanggungjawaban');
        
        // Validasi & Approval
        Route::get('/validasi', function () {
            return Inertia::render('SuperAdmin/Validasi');
        })->name('validasi');
        
        // Dokumen
        Route::get('/dokumen', function () {
            return Inertia::render('SuperAdmin/Dokumen');
        })->name('dokumen');
        
        // Laporan
        Route::get('/laporan', function () {
            return Inertia::render('SuperAdmin/Laporan');
        })->name('laporan');
        
        // Notifikasi
        Route::get('/notifikasi', function () {
            return Inertia::render('SuperAdmin/Notifikasi');
        })->name('notifikasi');
        
        // Kelola Pengguna
        Route::get('/kelola-pengguna', function () {
            return Inertia::render('SuperAdmin/KelolaPengguna');
        })->name('kelola-pengguna');
        
        // Data Master
        Route::get('/data-master', function () {
            return Inertia::render('SuperAdmin/DataMaster');
        })->name('data-master');
        
        // Backup Data
        Route::get('/backup-data', function () {
            return Inertia::render('SuperAdmin/BackupData');
        })->name('backup-data');
    });

    // ========================================
    // KETUA TIM KERJA ROUTES
    // ========================================
    Route::prefix('ketua-tim')->middleware('role:ketua_tim_kerja')->name('ketua-tim.')->group(function () {
        
        // Dashboard
        Route::get('/dashboard', function () {
            $user = auth()->user();
            return Inertia::render('KetuaTim/Dashboard', [
                'user' => $user,
                'timKerja' => $user->timKerja,
            ]);
        })->name('dashboard');
        
        // Perencanaan
        Route::get('/perencanaan', function () {
            return Inertia::render('KetuaTim/Perencanaan');
        })->name('perencanaan');
        
        // Perjanjian Kinerja
        Route::prefix('perencanaan/perjanjian-kinerja')->name('perencanaan.pk.')->group(function () {
            Route::get('awal/persiapan', fn() => Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Awal/Persiapan'))->name('awal.persiapan');
            Route::get('awal/progress', fn() => Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Awal/Progress'))->name('awal.progress');
            Route::get('revisi/persiapan', fn() => Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Revisi/Persiapan'))->name('revisi.persiapan');
            Route::get('revisi/progress', fn() => Inertia::render('KetuaTim/Perencanaan/PerjanjianKinerja/Revisi/Progress'))->name('revisi.progress');
        });
        
        // Rencana Aksi
        Route::prefix('perencanaan/rencana-aksi')->name('perencanaan.ra.')->group(function () {
            Route::get('awal/persiapan', fn() => Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Awal/Persiapan'))->name('awal.persiapan');
            Route::get('awal/progress', fn() => Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Awal/Progress'))->name('awal.progress');
            Route::get('revisi/persiapan', fn() => Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Revisi/Persiapan'))->name('revisi.persiapan');
            Route::get('revisi/progress', fn() => Inertia::render('KetuaTim/Perencanaan/RencanaAksi/Revisi/Progress'))->name('revisi.progress');
        });
        
        // Permohonan Dana
        Route::get('/permohonan-dana', function () {
            return Inertia::render('KetuaTim/PermohonanDana');
        })->name('permohonan-dana');
        
        // LPJ
        Route::get('/lpj', function () {
            return Inertia::render('KetuaTim/LPJ');
        })->name('lpj');
        
        // Dokumen
        Route::get('/dokumen', function () {
            return Inertia::render('KetuaTim/Dokumen');
        })->name('dokumen');
    });

    // ========================================
    // PIMPINAN ROUTES (Kabag Umum & PPK)
    // ========================================
    Route::prefix('pimpinan')->middleware('role:pimpinan')->name('pimpinan.')->group(function () {
        
        // Dashboard
        Route::get('/dashboard', function () {
            $user = auth()->user();
            return Inertia::render('Pimpinan/Dashboard', [
                'user' => $user,
                'pimpinanType' => $user->pimpinan_type,
            ]);
        })->name('dashboard');
        
        // Approval
        Route::get('/approval', function () {
            return Inertia::render('Pimpinan/Approval');
        })->name('approval');
        
        // Validasi
        Route::get('/validasi', function () {
            return Inertia::render('Pimpinan/Validasi');
        })->name('validasi');
        
        // Laporan
        Route::get('/laporan', function () {
            return Inertia::render('Pimpinan/Laporan');
        })->name('laporan');
    });

    // ========================================
    // BENDAHARA ROUTES
    // ========================================
    Route::prefix('bendahara')->middleware('role:bendahara')->name('bendahara.')->group(function () {
        
        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('Bendahara/Dashboard');
        })->name('dashboard');
        
        // Pencairan Dana
        Route::get('/pencairan', function () {
            return Inertia::render('Bendahara/Pencairan');
        })->name('pencairan');
        
        // Verifikasi LPJ
        Route::get('/verifikasi-lpj', function () {
            return Inertia::render('Bendahara/VerifikasiLPJ');
        })->name('verifikasi-lpj');
        
        // Laporan Keuangan
        Route::get('/laporan', function () {
            return Inertia::render('Bendahara/Laporan');
        })->name('laporan');
    });

});

// Include settings routes
require __DIR__.'/settings.php';