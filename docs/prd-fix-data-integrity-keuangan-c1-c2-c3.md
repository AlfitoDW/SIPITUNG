# PRD: Fix Data Integrity — Modul Keuangan (C1, C2, C3)

> Status: **Merged ke branch `main`**  
> Author: OpenCode Agent  
> Date: 2026-06-04  
> Scope: Backend (Laravel) + Frontend (React/TypeScript) + Database

---

## 1. Executive Summary

Tiga bug kritis ditemukan di modul keuangan (`permohonan_dana`) yang berpotensi menghilangkan audit trail dan merusak integritas data master.

| Bug | Severity | Impact |
|-----|----------|--------|
| **C1** — Hapus `tim_kerja` menghapus histori SPJ | 🔴 Critical | Seluruh `permohonan_dana` + items + nominatif + dokumen milik tim tersebut hilang permanen |
| **C2** — Hapus `tahun_anggaran` menghapus histori SPJ | 🔴 Critical | Seluruh SPJ untuk 1 tahun anggaran hilang permanen |
| **C3** — Approver dihapus → audit trail hilang + export tanda tangan salah | 🔴 Critical | Jejak persetujuan lenyap; export Nominatif keluar nama PPK/Bendahara yang salah |

---

## 2. Changes by Bug

### 2.1 C1 — Proteksi Hapus `tim_kerja`

#### Database
- **Migration:** `2026_06_04_100001_restrict_permohonan_dana_master_fks.php`
  - `permohonan_dana.tim_kerja_id`: FK constraint diubah `cascadeOnDelete` → `restrictOnDelete`

#### Backend
- **`app/Models/TimKerja.php`** — tambah relationship `permohonanDana(): HasMany`
- **`app/Http/Controllers/SuperAdmin/TimKerjaController.php`** — guard `destroy()`:
  ```php
  if ($timKerja->permohonanDana()->exists()) {
      return back()->withErrors(['delete' => 'Tim kerja tidak dapat dihapus karena masih memiliki histori permohonan dana. Nonaktifkan saja jika tidak lagi digunakan.']);
  }
  ```

#### Frontend
- **`resources/js/pages/SuperAdmin/TimKerja/Index.tsx`** — update pesan `AlertDialogDescription` untuk menyebutkan "histori permohonan dana"
- **`resources/js/pages/SuperAdmin/DataMaster/components/DeleteConfirmDialog.tsx`** — tambah props opsional `title` dan `description`

#### Test
- **`tests/Feature/Keuangan/TimKerjaDeleteGuardTest.php`**
  - Hapus tim dengan SPJ → ditolak, data tetap ada
  - Hapus tim tanpa SPJ & tanpa user → sukses
  - Hapus tim yang masih punya user → ditolak (existing guard)

---

### 2.2 C2 — Proteksi Hapus `tahun_anggaran`

#### Database
- **Migration:** `2026_06_04_100001_restrict_permohonan_dana_master_fks.php`
  - `permohonan_dana.tahun_anggaran_id`: FK constraint diubah `cascadeOnDelete` → `restrictOnDelete`

#### Backend
- **`app/Models/TahunAnggaran.php`** — tambah relationship `permohonanDana(): HasMany`
- **`app/Http/Controllers/SuperAdmin/TahunAnggaranController.php`** — guard `destroy()`:
  ```php
  if ($tahunAnggaran->permohonanDana()->exists()) {
      return back()->withErrors(['delete' => 'Tahun anggaran tidak dapat dihapus karena masih memiliki histori permohonan dana. Nonaktifkan saja jika tidak lagi digunakan.']);
  }
  ```

#### Frontend
- **`resources/js/pages/SuperAdmin/DataMaster/tabs/TahunAnggaranTab.tsx`** — `DeleteConfirmDialog` sekarang mengirim `title` dan `description` spesifik untuk tahun anggaran

#### Test
- **`tests/Feature/Keuangan/TahunAnggaranDeleteGuardTest.php`**
  - Hapus tahun dengan SPJ → ditolak, data tetap ada
  - Hapus tahun tanpa SPJ → sukses

---

### 2.3 C3 — Snapshot Approver & Audit Trail

#### Database
- **Migration:** `2026_06_04_200001_add_approver_snapshots_and_restrict_fks.php`
  - **10 kolom snapshot baru** di `permohonan_dana`:
    - `katim_approved_by_name`, `katim_approved_by_nip`
    - `kabag_approved_by_name`, `kabag_approved_by_nip`
    - `ppk_approved_by_name`, `ppk_approved_by_nip`
    - `pic_approved_by_name`, `pic_approved_by_nip`
    - `dicairkan_by_name`, `dicairkan_by_nip`
  - **5 FK constraint diubah:** `katim_approved_by`, `kabag_approved_by`, `ppk_approved_by`, `pic_approved_by`, `dicairkan_by` — `nullOnDelete` → `restrictOnDelete`

#### Model
- **`app/Models/PermohonanDana.php`** — tambah 10 kolom snapshot ke `$fillable`

#### Approval Controllers (Snapshot Write)
Saat approval, simpan nama & NIP approver saat itu:

| Controller | Method | Snapshot Fields |
|------------|--------|-----------------|
| `KetuaTim/PermohonanDanaController` | `approve()` | `katim_approved_by_name`, `katim_approved_by_nip` |
| `Pimpinan/PermohonanDanaController` | `approve()` | `kabag_approved_by_name`, `kabag_approved_by_nip` atau `ppk_approved_by_name`, `ppk_approved_by_nip` |
| `PicKeuangan/PermohonanDanaController` | `approve()` | `pic_approved_by_name`, `pic_approved_by_nip` |
| `Bendahara/PermohonanDanaController` | `setujui()` | `dicairkan_by_name`, `dicairkan_by_nip` |

#### Serialization Controllers (Snapshot Read)
Semua controller yang kirim `*_approved_by_name` ke frontend sekarang baca **snapshot dulu**, fallback ke live relation untuk data lama:

```php
'katim_approved_by_name' => $pd->katim_approved_by_name ?? $pd->katimApprovedBy?->nama_lengkap,
```

**File yang di-update:**
- `KetuaTim/PermohonanDanaController` (`index`, `show`, `print`)
- `Pimpinan/PermohonanDanaController` (`index`, `show`)
- `PicKeuangan/PermohonanDanaController` (`index`, `show`, `print`)
- `Bendahara/PermohonanDanaController` (`index`, `show`, `print`)
- `Pumk/PermohonanDanaController` (`index`, `print`)
- `SuperAdmin/KeuanganController` (`permohonanDana`, `showPermohonanDana`, `printPermohonanDana`)

#### Export
- **`app/Exports/NominatifExport.php`**
  - Constructor: `$this->bendahara = $this->pd->dicairkanBy` (bukan live query)
  - `updateFooter()`: hapus fallback `User::where('role', 'pimpinan')->where('pimpinan_type', 'ppk')->first()`. Selalu pakai snapshot columns `ppk_approved_by_name` dan `dicairkan_by_name`.

#### User Management
- **`app/Http/Controllers/SuperAdmin/UserController.php`** — guard `destroy()`:
  ```php
  $hasApprovalHistory = PermohonanDana::where('katim_approved_by', $user->id)
      ->orWhere('kabag_approved_by', $user->id)
      ->orWhere('ppk_approved_by', $user->id)
      ->orWhere('pic_approved_by', $user->id)
      ->orWhere('dicairkan_by', $user->id)
      ->exists();
  if ($hasApprovalHistory) {
      return redirect()->back()->withErrors(['error' => 'User tidak dapat dihapus karena pernah melakukan approval pada permohonan dana. Nonaktifkan saja.']);
  }
  ```

#### Backfill Command
- **`app/Console/Commands/BackfillApproverSnapshots.php`**
  - Command: `php artisan backfill:approver-snapshots`
  - Loop 5 approval steps, chunk 100 records, isi snapshot dari relasi `users` yang masih ada

#### Test
- **`tests/Feature/Keuangan/ApproverSnapshotTest.php`** (6 test)
  - KA.TIM approval menyimpan snapshot
  - PPK approval menyimpan snapshot
  - Snapshot tetap benar walau user dinonaktifkan
  - Snapshot tetap benar walau user ganti nama
  - Export Nominatif membaca snapshot
  - User yang pernah approve tidak bisa dihapus

---

## 3. Deployment Checklist

```bash
# 1. Jalankan migration
php artisan migrate

# 2. WAJIB: backfill data lama sebelum ada user yang dihapus
php artisan backfill:approver-snapshots

# 3. Verifikasi (opsional)
php artisan test tests/Feature/Keuangan/
```

**⚠️ Warning:** Kalau tidak jalankan backfill, SPJ yang sudah di-approve sebelum deploy akan punya kolom snapshot kosong. Export akan fallback ke relasi live — masih benar selama user belum dihapus, tapi berisiko setelah user dihapus.

---

## 4. Files Modified (22 files)

### New Files (6)
1. `database/migrations/2026_06_04_100001_restrict_permohonan_dana_master_fks.php`
2. `database/migrations/2026_06_04_200001_add_approver_snapshots_and_restrict_fks.php`
3. `app/Console/Commands/BackfillApproverSnapshots.php`
4. `tests/Feature/Keuangan/TimKerjaDeleteGuardTest.php`
5. `tests/Feature/Keuangan/TahunAnggaranDeleteGuardTest.php`
6. `tests/Feature/Keuangan/ApproverSnapshotTest.php`

### Modified Files (16)
7. `app/Models/TimKerja.php` — + `permohonanDana()`
8. `app/Models/TahunAnggaran.php` — + `permohonanDana()`
9. `app/Models/PermohonanDana.php` — `$fillable` + 10 snapshot
10. `app/Http/Controllers/SuperAdmin/TimKerjaController.php` — guard destroy
11. `app/Http/Controllers/SuperAdmin/TahunAnggaranController.php` — guard destroy
12. `app/Http/Controllers/SuperAdmin/UserController.php` — guard destroy
13. `app/Http/Controllers/KetuaTim/PermohonanDanaController.php` — snapshot write + read
14. `app/Http/Controllers/Pimpinan/PermohonanDanaController.php` — snapshot write + read
15. `app/Http/Controllers/PicKeuangan/PermohonanDanaController.php` — snapshot write + read
16. `app/Http/Controllers/Bendahara/PermohonanDanaController.php` — snapshot write + read
17. `app/Http/Controllers/Pumk/PermohonanDanaController.php` — snapshot read
18. `app/Http/Controllers/SuperAdmin/KeuanganController.php` — snapshot read
19. `app/Exports/NominatifExport.php` — constructor + updateFooter
20. `resources/js/pages/SuperAdmin/TimKerja/Index.tsx` — alert dialog
21. `resources/js/pages/SuperAdmin/DataMaster/tabs/TahunAnggaranTab.tsx` — delete dialog
22. `resources/js/pages/SuperAdmin/DataMaster/components/DeleteConfirmDialog.tsx` — props

---

## 5. Known Limitations & Future Work

### H0 — `created_by` Snapshot (Recommended Next)
`created_by` FK pakai default `RESTRICT` (aman dari penghapusan), tapi nama PUMK masih live lookup. Kalau PUMK ganti nama, semua SPJ yang dia buat tampilkan nama baru. Untuk konsistensi audit trail, sebaiknya tambah `created_by_name` dan `created_by_nip` snapshot.

### H1 — Live Budget Lookups (🔴 High Priority)
`sisa_anggaran` dan `harga_satuan` dihitung live dari `dja_rincian_biaya`. Kalau pagu/SBM diubah, SPJ lama tampak invalid. Butuh snapshot `pagu_snapshot` dan `sbm_snapshot` di `permohonan_dana_item` saat submit.

### H2 — Orphan Items Setelah Hapus Rincian Biaya (🔴 High Priority)
`dja_rincian_biaya_id` di `permohonan_dana_item` pakai `nullOnDelete()`. Kalau rincian biaya dihapus, item tidak terhitung di query `terpakai` → budget tampak lebih besar dari realitas. Butuh prevent deletion guard.

### H3 — Race Condition Budget Overdraw (🔴 High Priority)
`updateStep4` validasi pagu tanpa `lockForUpdate()`. Dua PUMK submit bersamaan bisa melebihi pagu. Butuh `DB::transaction()` + `lockForUpdate()`.

### H4 — Nominatif Snapshot Validation (🟠 Medium Priority)
`NominatifController::store()` tidak validasi bahwa snapshot fields cocok dengan `ref_nama_id`. Frontend bisa kirim `ref_nama_id` Pegawai A tapi data bank Pegawai B.

### H5 — Hardcoded Honor/Perjadin Akun (🟡 Low Priority)
`HONOR_AKUN` dan `PERJADIN_AKUN` hardcoded di frontend dan backend. Kalau kode akun diubah di DJA, klasifikasi jadi salah.

---

## 6. Test Results

```
Tests\Feature\Keuangan .............................................. 59 passed (186 assertions)
Duration: 1.12s
```

All tests pass. No regression on existing tests.
