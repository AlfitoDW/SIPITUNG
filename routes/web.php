<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/perencanaan', function () {
    return Inertia::render('Perencanaan');
})->middleware(['auth', 'verified'])->name('perencanaan.index');

Route::get('/perencanaan/perjanjian-kinerja/awal/persiapan', fn() => Inertia::render('Perencanaan/PerjanjianKinerja/Awal/Persiapan'))->middleware(['auth', 'verified'])->name('perencanaan.pk.awal.persiapan');
Route::get('/perencanaan/perjanjian-kinerja/awal/progress', fn() => Inertia::render('Perencanaan/PerjanjianKinerja/Awal/Progress'))->middleware(['auth', 'verified'])->name('perencanaan.pk.awal.progres');
Route::get('/perencanaan/perjanjian-kinerja/revisi/persiapan', fn() => Inertia::render('Perencanaan/PerjanjianKinerja/Revisi/Persiapan'))->middleware(['auth', 'verified'])->name('perencanaan.pk.revisi.persiapan');
Route::get('/perencanaan/perjanjian-kinerja/revisi/progress', fn() => Inertia::render('Perencanaan/PerjanjianKinerja/Revisi/Progress'))->middleware(['auth', 'verified'])->name('perencanaan.pk.revisi.progres');


Route::get('/perencanaan/rencana-aksi/awal/persiapan', fn() => Inertia::render('Perencanaan/RencanaAksi/Awal/Persiapan'))->middleware(['auth', 'verified'])->name('perencanaan.ra.awal.persiapan');
Route::get('/perencanaan/rencana-aksi/awal/progress', fn() => Inertia::render('Perencanaan/RencanaAksi/Awal/Progress'))->middleware(['auth', 'verified'])->name('perencanaan.ra.awal.progres');
Route::get('/perencanaan/rencana-aksi/revisi/persiapan', fn() => Inertia::render('Perencanaan/RencanaAksi/Revisi/Persiapan'))->middleware(['auth', 'verified'])->name('perencanaan.ra.revisi.persiapan');
Route::get('/perencanaan/rencana-aksi/revisi/progress', fn() => Inertia::render('Perencanaan/RencanaAksi/Revisi/Progress'))->middleware(['auth', 'verified'])->name('perencanaan.ra.revisi.progres');

Route::get('/keuangan', function () {
    return Inertia::render('Keuangan');
})->middleware(['auth', 'verified'])->name('keuangan.index');

Route::get('/pertanggungjawaban', function () {
    return Inertia::render('PertanggungJawaban');
})->middleware(['auth', 'verified'])->name('pertanggungjawaban.index');

Route::get('/validasi-approval', function () {
    return Inertia::render('ValidasiApproval');
})->middleware(['auth', 'verified'])->name('validasi-approval.index');



Route::get('/dokumen', function () {
    return Inertia::render('Dokumen');
})->middleware(['auth', 'verified'])->name('dokumen.index');

Route::get('/laporan', function () {
    return Inertia::render('Laporan');
})->middleware(['auth', 'verified'])->name('laporan.index');

Route::get('/notifikasi', function () {
    return Inertia::render('Notifikasi');
})->middleware(['auth', 'verified'])->name('notifikasi.index');

Route::get('/kelola-pengguna', function () {
    return Inertia::render('KelolaPengguna');
})->middleware(['auth', 'verified'])->name('kelola-pengguna.index');

Route::get('/data-master', function () {
    return Inertia::render('DataMaster');
})->middleware(['auth', 'verified'])->name('data-master.index');

Route::get('/backup-data', function () {
    return Inertia::render('BackupData');
})->middleware(['auth', 'verified'])->name('backup-data.index');



require __DIR__.'/settings.php';
