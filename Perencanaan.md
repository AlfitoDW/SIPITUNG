# Perencanaan — Outline Fitur

**Tanggal:** 2026-03-04
**Terakhir Diupdate:** 2026-03-04
**Status Saat Ini:** Backend (migration, model, seeder, controller) sudah ada. Frontend SuperAdmin sudah konek ke DB. KetuaTim sudah ada halaman tapi masih read-only — CRUD belum diimplementasi.

---

## 1. Siapa yang Mengisi Apa?

### Ketua Tim Perencanaan & Keuangan (`ketua_tim_kerja`)
**→ Aktor utama pengisi data.** Bertanggung jawab penuh atas input dan pembaruan seluruh data perencanaan:

| Dokumen | Aksi yang Boleh Dilakukan |
|---|---|
| Perjanjian Kinerja (PK) Awal | Input / Edit / Submit |
| Perjanjian Kinerja (PK) Revisi | Input / Edit / Submit |
| Rencana Aksi (RA) | Input / Edit / Submit |

Ketua Tim mengisi field-field seperti:
- Sasaran Strategis (kode + nama)
- Indikator Kinerja Utama / IKU (kode + nama + satuan + target)
- Target per Triwulan I, II, III, IV (khusus Rencana Aksi)
- Status penyusunan (draft → submitted → approved)

**Batasan:**
- Hanya bisa edit data milik timnya sendiri (`tim_kerja_id`)
- Setelah status `approved`, dokumen terkunci — tidak bisa edit kecuali SuperAdmin membuka kembali

### SuperAdmin
**→ Monitor semua tim + validasi/finalisasi.** Fungsi SuperAdmin di sini adalah:
- Memonitor progres pengisian dari seluruh Tim Kerja
- Melihat rekapitulasi semua data PK dan RA
- Approve atau reject dokumen yang sudah di-submit KetuaTim
- Bisa override/edit data tim manapun jika diperlukan
- Membuka kembali dokumen yang sudah approved jika ada kebutuhan revisi

### Pimpinan (`pimpinan` — `kabag_umum` / `ppk`)
- Melihat laporan ringkasan Perjanjian Kinerja dan Rencana Aksi
- (Opsional ke depan) Tanda tangan / approval dokumen

---

## 2. Alur Kerja (Workflow)

```
Ketua Tim mengisi PK Awal
        ↓
    Status: draft  (bisa edit bebas)
        ↓
    Ketua Tim submit → Status: submitted
        ↓
    SuperAdmin review
        ↓
    approved → dokumen terkunci    |    rejected → kembali ke draft (KetuaTim revisi)
        ↓
    Jika ada revisi → Ketua Tim isi PK Revisi (dokumen terpisah, jenis = 'revisi')
```

Untuk **Rencana Aksi (RA)** tidak ada Awal/Revisi — hanya satu dokumen dengan Penyusunan dan Progress.

### Tabel Aksi per Status

| Status | KetuaTim bisa | SuperAdmin bisa |
|---|---|---|
| `draft` | Edit, Delete, Submit | Edit, Delete, Submit |
| `submitted` | Lihat saja | Approve, Reject, Edit |
| `approved` | Lihat saja | Buka kembali (→ draft), Edit |
| `rejected` | Edit (kembali ke draft), Submit ulang | Edit, Submit |

---

## 3. Struktur Data yang Dibutuhkan

### Tabel: `perjanjian_kinerja`
| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| tahun_anggaran_id | bigint | FK → tahun_anggaran |
| tim_kerja_id | bigint | FK → tim_kerja |
| jenis | enum('awal', 'revisi') | Jenis dokumen |
| status | enum('draft', 'submitted', 'approved', 'rejected') | Status penyusunan |
| created_by | bigint | FK → users |
| updated_at / created_at | timestamps | - |

### Tabel: `sasaran`
| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| perjanjian_kinerja_id | bigint | FK → perjanjian_kinerja |
| kode | string | Contoh: S 1, S 2 |
| nama | text | Uraian sasaran |
| urutan | integer | Urutan tampil |

### Tabel: `indikator_kinerja`
| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| sasaran_id | bigint | FK → sasaran |
| kode | string | Contoh: IKU 1.1 |
| nama | text | Uraian indikator |
| satuan | string | %, Nilai, Predikat, dll |
| target | string | Target tahunan |
| urutan | integer | Urutan tampil |

### Tabel: `rencana_aksi`
| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| tahun_anggaran_id | bigint | FK → tahun_anggaran |
| tim_kerja_id | bigint | FK → tim_kerja |
| status | enum('draft', 'submitted', 'approved', 'rejected') | Status penyusunan |
| created_by | bigint | FK → users |

### Tabel: `rencana_aksi_indikator`
> Extends indikator_kinerja dengan target triwulanan, atau bisa jadi tabel terpisah.

| Field | Tipe | Keterangan |
|---|---|---|
| id | bigint | PK |
| rencana_aksi_id | bigint | FK → rencana_aksi |
| indikator_kinerja_id | bigint | FK → indikator_kinerja (opsional, bisa duplikat) |
| kode | string | Kode IKU |
| nama | text | Uraian |
| satuan | string | - |
| target | string | Target tahunan |
| target_tw1 | string | Target Triwulan I |
| target_tw2 | string | Target Triwulan II |
| target_tw3 | string | Target Triwulan III |
| target_tw4 | string | Target Triwulan IV |

---

## 4. Halaman yang Perlu Dibangun

### 4A. KetuaTim

| Halaman | Route | Status | Fungsi |
|---|---|---|---|
| `KetuaTim/.../PerjanjianKinerja/Awal/Penyusunan` | `.../awal/persiapan` | ✅ Ada, read-only | Perlu tambah form CRUD |
| `KetuaTim/.../PerjanjianKinerja/Awal/Progress` | `.../awal/progress` | ✅ Ada, read-only | Implementasi konten |
| `KetuaTim/.../PerjanjianKinerja/Revisi/Penyusunan` | `.../revisi/persiapan` | ✅ Ada, read-only | Perlu tambah form CRUD |
| `KetuaTim/.../PerjanjianKinerja/Revisi/Progress` | `.../revisi/progress` | ✅ Ada, read-only | Implementasi konten |
| `KetuaTim/.../RencanaAksi/Penyusunan` | `.../rencana-aksi/penyusunan` | ✅ Ada, read-only | Perlu tambah form CRUD |
| `KetuaTim/.../RencanaAksi/Progress` | `.../rencana-aksi/progress` | ✅ Ada, read-only | Implementasi konten |

**Yang perlu ditambahkan di setiap halaman Penyusunan KetuaTim:**
- Tombol "Tambah Sasaran" / "Tambah Indikator" (PK) atau "Edit Target Triwulan" (RA)
- Dialog/form inline untuk create & edit
- Tombol delete per baris
- Tombol "Submit ke SuperAdmin" (ubah status → `submitted`)
- Badge status dokumen (draft / submitted / approved / rejected)

### 4B. SuperAdmin

| Halaman | Status | Yang Perlu Ditambahkan |
|---|---|---|
| `SuperAdmin/.../PerjanjianKinerja/Awal/Penyusunan` | ✅ Ada, konek DB | Tombol Approve/Reject per Tim Kerja, badge status |
| `SuperAdmin/.../PerjanjianKinerja/Revisi/Penyusunan` | ✅ Ada, konek DB | Sama seperti di atas |
| `SuperAdmin/.../RencanaAksi/Penyusunan` | ✅ Ada, konek DB | Sama seperti di atas |
| `SuperAdmin/.../Progress` (semua) | ⚠️ Placeholder | Implementasi konten progres nyata |

---

## 5. Backend yang Perlu Dibangun

### Controllers

| Controller | Status | Fungsi |
|---|---|---|
| `KetuaTim/PerencanaanController` | ✅ Ada (GET only) | Perlu tambah POST/PUT/DELETE + submit |
| `SuperAdmin/PerencanaanController` | ✅ Ada (GET only) | Perlu tambah approve/reject/reopen |

### Route KetuaTim — yang perlu ditambahkan

```php
// PK Awal
Route::post('awal/init', [PerencanaanController::class, 'pkAwalInit'])->name('awal.init');         // Buat PK baru jika belum ada
Route::post('awal/sasaran', [PerencanaanController::class, 'sasaranStore'])->name('awal.sasaran.store');
Route::put('awal/sasaran/{sasaran}', [PerencanaanController::class, 'sasaranUpdate'])->name('awal.sasaran.update');
Route::delete('awal/sasaran/{sasaran}', [PerencanaanController::class, 'sasaranDestroy'])->name('awal.sasaran.destroy');
Route::post('awal/indikator', [PerencanaanController::class, 'indikatorStore'])->name('awal.indikator.store');
Route::put('awal/indikator/{indikator}', [PerencanaanController::class, 'indikatorUpdate'])->name('awal.indikator.update');
Route::delete('awal/indikator/{indikator}', [PerencanaanController::class, 'indikatorDestroy'])->name('awal.indikator.destroy');
Route::patch('awal/submit', [PerencanaanController::class, 'pkAwalSubmit'])->name('awal.submit');

// Rencana Aksi
Route::post('rencana-aksi/init', ...)->name('ra.init');                                             // Buat RA baru
Route::put('rencana-aksi/indikator/{indikator}', ...)->name('ra.indikator.update');                 // Edit target TW
Route::patch('rencana-aksi/submit', ...)->name('ra.submit');
```

### Route SuperAdmin — yang perlu ditambahkan

```php
// Approve / reject / reopen per dokumen
Route::patch('perjanjian-kinerja/{pk}/approve', ...)->name('pk.approve');
Route::patch('perjanjian-kinerja/{pk}/reject', ...)->name('pk.reject');
Route::patch('perjanjian-kinerja/{pk}/reopen', ...)->name('pk.reopen');
Route::patch('rencana-aksi/{ra}/approve', ...)->name('ra.approve');
Route::patch('rencana-aksi/{ra}/reject', ...)->name('ra.reject');
```

---

## 6. Ringkasan Gap Saat Ini

| Komponen | Ada? | Catatan |
|---|---|---|
| Migration tabel PK & RA | ✅ | Sudah ada (5 migration files) |
| Models PK, Sasaran, IKU, RA | ✅ | Sudah ada |
| Seeder data default | ✅ | PerencanaanSeeder sudah ada |
| `KetuaTim/PerencanaanController` | ✅ | Ada, tapi hanya GET |
| `SuperAdmin/PerencanaanController` | ✅ | Ada, tapi hanya GET |
| Halaman SuperAdmin PK/RA (view) | ✅ | Sudah konek ke DB via Inertia props |
| Halaman KetuaTim (semua) | ✅ | Ada, tapi masih read-only |
| CRUD routes KetuaTim (POST/PUT/DELETE) | ❌ | Belum ada |
| Form/dialog input KetuaTim | ❌ | Belum ada |
| Status workflow (draft→submitted→approved) | ❌ | Kolom status ada di DB, tapi belum ada aksi |
| Approval routes SuperAdmin | ❌ | Belum ada |
| Halaman Progress (semua) | ❌ | Placeholder kosong |

---

## 7. Urutan Pengerjaan yang Disarankan

> Migration, Model, Seeder, Controller GET, dan halaman view sudah selesai. Fokus selanjutnya ke CRUD dan workflow.

1. **Update migration** — ubah enum `status` dari `('draft','final')` → `('draft','submitted','approved','rejected')` di tabel `perjanjian_kinerja` dan `rencana_aksi`
2. **KetuaTim PK Awal CRUD** (pilot):
   - Tambah route POST/PUT/DELETE + submit di `ketua-tim.php`
   - Tambah method controller di `KetuaTim/PerencanaanController`
   - Tambah form/dialog di halaman `Penyusunan.tsx` (dialog tambah sasaran, inline edit indikator)
   - Tambah tombol Submit + badge status
3. **KetuaTim PK Revisi CRUD** — ikuti pola yang sama dengan PK Awal
4. **KetuaTim Rencana Aksi CRUD** — inline edit target triwulan per baris
5. **SuperAdmin approve/reject** — tambah route + method controller + tombol di halaman SuperAdmin
6. **Halaman Progress** — implementasi konten (persentase field terisi, status per tim)
7. **(Opsional)** Notifikasi saat status berubah (submitted → approve/reject)

---

## Catatan Tambahan

- Data Sasaran & IKU untuk LLDIKTI kemungkinan **tidak berubah setiap tahun** (atau berubah sangat sedikit). Bisa dipertimbangkan untuk seeder default per `tahun_anggaran`.
- `tim_kerja_id` di KetuaTim harus selalu di-scope ke tim milik user yang login — jangan biarkan user bisa akses data tim lain.
- Progress page bisa berupa checklist sederhana atau persentase field yang sudah terisi.
