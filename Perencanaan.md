# Perencanaan — Outline Fitur

**Tanggal:** 2026-03-04
**Terakhir Diupdate:** 2026-03-04
**Status Saat Ini:** ✅ CRUD lengkap sudah diimplementasi. KetuaTim bisa input/edit/hapus/submit. SuperAdmin bisa approve/reject/reopen. Progress bar dan status badge sudah aktif.

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

| Halaman | Route | Status |
|---|---|---|
| `KetuaTim/.../PerjanjianKinerja/Awal/Penyusunan` | `.../awal/persiapan` | ✅ CRUD + progress bar + status badge |
| `KetuaTim/.../PerjanjianKinerja/Awal/Progress` | `.../awal/progress` | ✅ Ada (placeholder) |
| `KetuaTim/.../PerjanjianKinerja/Revisi/Penyusunan` | `.../revisi/persiapan` | ✅ CRUD + progress bar + status badge |
| `KetuaTim/.../PerjanjianKinerja/Revisi/Progress` | `.../revisi/progress` | ✅ Ada (placeholder) |
| `KetuaTim/.../RencanaAksi/Penyusunan` | `.../rencana-aksi/penyusunan` | ✅ CRUD + progress bar + status badge |
| `KetuaTim/.../RencanaAksi/Progress` | `.../rencana-aksi/progress` | ✅ Ada (placeholder) |

**Yang sudah ada di setiap halaman Penyusunan KetuaTim:**
- Progress bar 5-step (buat → sasaran → indikator → submit → disetujui)
- Badge status (Draft / Menunggu / Disetujui / Ditolak) dengan warna berbeda
- Buat dokumen baru (jika belum ada) via tombol + POST init
- Dialog tambah/edit Sasaran (PK) atau Indikator (RA)
- Tombol delete per baris dengan AlertDialog konfirmasi
- Tombol "Submit ke SuperAdmin" dengan konfirmasi (hanya muncul saat editable + ada data)
- Banner info saat dokumen terkunci (submitted/approved) atau ditolak

### 4B. SuperAdmin

| Halaman | Status |
|---|---|
| `SuperAdmin/.../PerjanjianKinerja/Awal/Penyusunan` | ✅ Badge status + tombol Setujui/Tolak/Buka Kembali |
| `SuperAdmin/.../PerjanjianKinerja/Revisi/Penyusunan` | ✅ Badge status + tombol Setujui/Tolak/Buka Kembali |
| `SuperAdmin/.../RencanaAksi/Penyusunan` | ✅ Badge status + tombol Setujui/Tolak/Buka Kembali |
| `SuperAdmin/.../Progress` (semua) | ⚠️ Placeholder — belum diimplementasi |

---

## 5. Backend yang Perlu Dibangun

### Controllers

| Controller | Status | Method yang ada |
|---|---|---|
| `KetuaTim/PerencanaanController` | ✅ Lengkap | pkAwal, pkAwalInit, pkAwalSubmit, pkRevisi, pkRevisiInit, pkRevisiSubmit, sasaranStore/Update/Destroy, indikatorStore/Update/Destroy, raInit, raIndikatorStore/Update/Destroy, raSubmit, progress semua |
| `SuperAdmin/PerencanaanController` | ✅ Lengkap | pkAwal, pkRevisi, rencanaAksi, pkApprove, pkReject, pkReopen, raApprove, raReject, raReopen |

### Route KetuaTim (sudah diimplementasi)

```php
// PK Awal & Revisi
Route::post('awal/init', ...) / Route::post('revisi/init', ...)
Route::patch('awal/submit', ...) / Route::patch('revisi/submit', ...)

// Sasaran (shared awal & revisi)
Route::post/put/delete 'perencanaan/sasaran/{sasaran}'

// Indikator Kinerja (shared)
Route::post/put/delete 'perencanaan/indikator/{indikator}'

// Rencana Aksi
Route::post 'rencana-aksi/init'
Route::post/put/delete 'rencana-aksi/indikator/{indikator}'
Route::patch 'rencana-aksi/submit'
```

### Route SuperAdmin (sudah diimplementasi)

```php
Route::patch 'perjanjian-kinerja/{pk}/approve|reject|reopen'
Route::patch 'rencana-aksi/{ra}/approve|reject|reopen'
```

---

## 6. Ringkasan Status Saat Ini

| Komponen | Status | Catatan |
|---|---|---|
| Migration tabel PK & RA | ✅ | Status enum: `draft\|submitted\|approved\|rejected` |
| Models PK, Sasaran, IKU, RA | ✅ | Helper methods: `isEditable()`, `isApproved()`, dll |
| Seeder data default | ✅ | PerencanaanSeeder — 4 sasaran, 9 IKU |
| `KetuaTim/PerencanaanController` | ✅ | CRUD lengkap + submit |
| `SuperAdmin/PerencanaanController` | ✅ | View + approve/reject/reopen |
| Halaman KetuaTim Penyusunan PK Awal | ✅ | CRUD + progress bar + badge + submit |
| Halaman KetuaTim Penyusunan PK Revisi | ✅ | CRUD + progress bar + badge + submit |
| Halaman KetuaTim Penyusunan RA | ✅ | CRUD + progress bar + badge + submit |
| Halaman SuperAdmin PK Awal/Revisi | ✅ | Badge status + Setujui/Tolak/Buka Kembali |
| Halaman SuperAdmin RA | ✅ | Badge status + Setujui/Tolak/Buka Kembali |
| Status workflow (draft→submitted→approved) | ✅ | Fully implemented di FE + BE |
| Halaman Progress (semua, 6 halaman) | ⚠️ | Placeholder — belum ada konten nyata |

---

## 7. Riwayat Pengerjaan

| Step | Tanggal | Keterangan | Status |
|---|---|---|---|
| 1 | 2026-03-04 | Update enum status migration + helper methods model | ✅ Done |
| 2 | 2026-03-04 | KetuaTim — route CRUD + controller lengkap | ✅ Done |
| 3 | 2026-03-04 | KetuaTim PK Awal — UI CRUD + progress bar + badge | ✅ Done |
| 4 | 2026-03-04 | KetuaTim PK Revisi — UI CRUD + progress bar + badge | ✅ Done |
| 5 | 2026-03-04 | KetuaTim Rencana Aksi — UI CRUD + progress bar + badge | ✅ Done |
| 6 | 2026-03-04 | SuperAdmin — approve/reject/reopen + badge status | ✅ Done |

## 8. Pekerjaan Selanjutnya

1. **Halaman Progress** (6 halaman placeholder) — implementasi konten realisasi kinerja per triwulan
2. **(Opsional)** Notifikasi saat status berubah (submitted → approve/reject)
3. **(Opsional)** Export dokumen PK/RA ke PDF

---

## Catatan Tambahan

- Data Sasaran & IKU untuk LLDIKTI kemungkinan **tidak berubah setiap tahun** (atau berubah sangat sedikit). Bisa dipertimbangkan untuk seeder default per `tahun_anggaran`.
- `tim_kerja_id` di KetuaTim harus selalu di-scope ke tim milik user yang login — jangan biarkan user bisa akses data tim lain.
- Progress page bisa berupa checklist sederhana atau persentase field yang sudah terisi.
