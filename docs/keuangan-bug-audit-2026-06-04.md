# Audit Bug Data Integrity — Modul Keuangan

> **Tanggal Audit:** 2026-06-04  
> **Scope:** Backend (Laravel), Frontend (React/TypeScript), Database, Export Excel  
> **Status:** Batch 1 (C1-C3-H2-H3) sudah fix ✅ — Batch 2 (18 bug baru) menunggu eksekusi  
> **Total Bug Ditemukan:** 23 (6 sudah fix, 17 menunggu)

---

## ✅ SUDAH FIX (Batch 1 — 2026-06-04)

| Bug | Severity | Deskripsi | File Diubah |
|-----|----------|-----------|-------------|
| **C1** | 🔴 Critical | Hapus `tim_kerja` → cascade hapus semua SPJ milik tim tersebut | 10 file |
| **C2** | 🔴 Critical | Hapus `tahun_anggaran` → cascade hapus semua SPJ tahun tersebut | 3 file |
| **C3** | 🔴 Critical | Approver user dihapus → nama approval lenyap, export tanda tangan salah | 12 file |
| **H2** | 🔴 High | Hapus DJA hierarchy (program→rincian) → orphan `permohonan_dana_item` | 2 file |
| **H3** | 🔴 High | Race condition: dua PUMK submit bersamaan → budget overdraw | 1 file |

**Test Result Batch 1:** 70 test passed, 226 assertions, 1.16 detik

---

## ✅ SUDAH FIX (Batch 1.5 — Multi-Year DJA Support — 2026-06-04)

| Bug | Severity | Deskripsi | File Diubah |
|-----|----------|-----------|-------------|
| **Multi-Year** | 🔴 Critical | `dja_program.kode` unique global → import tahun baru gagal dengan SQL error. Tidak bisa punya DJA untuk tahun berbeda dengan kode program sama. | 3 file |

**Detail Fix:**
- **Migration:** `2026_06_04_300001_alter_dja_program_unique_kode_tahun.php`
  - Drop unique constraint `kode` (global)
  - Add composite unique `['kode', 'tahun_anggaran']`
- **Controller:** `DjaController.php`
  - `programStore()`: validasi `Rule::unique(...)->where('tahun_anggaran', $tahun->tahun)`
  - `programUpdate()`: validasi scoped ke tahun aktif
- **Import:** `importExcel()` sudah pakai `updateOrCreate(['kode', 'tahun_anggaran'], ...)` — tidak perlu ubah

**Test:** `tests/Feature/Keuangan/DjaMultiYearSupportTest.php` (5 test)
- Kode program sama boleh di tahun berbeda ✅
- Kode program sama ditolak dalam tahun yang sama ❌
- Update kode ke yang sudah ada di tahun lain → sukses ✅
- Update kode ke duplicate dalam tahun sama → ditolak ❌
- Index scope ke tahun_anggaran session → tidak bercampur ✅

**Test Result Batch 1.5:** 75 test passed (253 assertions), 1.22 detik — no regression

---

## 🆕 BUG BARU — MENUNGGU EKSEKUSI (Batch 2)

### 🔴 CRITICAL (3 bug) — Fix segera

| # | Bug | File | Impact | Rekomendasi Fix |
|---|-----|------|--------|----------------|
| **3.1** | **Cross-SPJ Nominatif Injection** | `Pumk/NominatifController.php` | User bisa kirim `item_id` dari SPJ lain → nominatif tercampur antar SPJ, total corrupt | Validasi: `item_id` harus milik `$pd` yang sedang di-edit |
| **3.4** | **Export Perjadin Dalam Minus Field** | `Exports/NominatifExport.php` | `representasi`, `taksi_pp`, `tiket_pesawat` tidak masuk total Excel → uang di export **lebih kecil** dari realitas | Tambah 3 field ke `calculateTotalDiterima()` untuk akun perjadin dalam |
| **1.1/4.1** | **Race Condition Budget Overdraw** *(perlu verifikasi)* | `Pumk/PermohonanDanaController.php` | `lockForUpdate()` di `dja_rincian_biaya` mungkin tidak cukup serialize concurrent insert ke `permohonan_dana_item` | Verifikasi dulu — kalau valid, tambah application-level lock (Redis) |

---

### 🟠 HIGH (7 bug) — Fix dalam minggu ini

| # | Bug | File | Impact | Rekomendasi Fix |
|---|-----|------|--------|----------------|
| **2.1** | **Katim Approval Race Condition** | `KetuaTim/PermohonanDanaController.php` | Double-click approve / dua tab → status overwrite | `lockForUpdate()` + re-check status di dalam transaction |
| **2.2** | **PIC Approval Race Condition** | `PicKeuangan/PermohonanDanaController.php` | Sama seperti 2.1 | `lockForUpdate()` + re-check status di dalam transaction |
| **2.3** | **Bendahara `setujui()` Race Condition** | `Bendahara/PermohonanDanaController.php` | Sama seperti 2.1 | `lockForUpdate()` + re-check status di dalam transaction |
| **3.2** | **Nominatif Snapshot Mismatch** | `Pumk/NominatifController.php` | Kirim `ref_nama_id` = Pegawai A, tapi `no_rekening` = Pegawai B → uang masuk ke rekening B | Kalau `ref_nama_id` ada, overwrite snapshot fields dari database `RefNama` |
| **5.1** | **`nullOnDelete` Rincian Biaya FK** | Migration `add_dja_fields_to_permohonan_dana` | Rincian dihapus → `dja_rincian_biaya_id` jadi NULL → item tidak terhitung di `terpakai` → budget tampak lebih besar | Ubah FK ke `restrictOnDelete()` (sama seperti C1/C2) |
| **5.2** | **Rejection Records Cascade Delete** | Migration `create_permohonan_dana_rejections_table` | User dihapus → `permohonan_dana_rejections` ikut hapus → jejak penolakan hilang | Ubah `rejected_by` FK ke `restrictOnDelete()` |
| **H0** | **`created_by` Live Lookup** | 6 controllers (index/show/print) | Nama PUMK pembuat SPJ berubah kalau PUMK ganti nama → audit trail tidak konsisten | Tambah `created_by_name` + `created_by_nip` snapshot di `permohonan_dana`, isi saat submit |

---

### 🟡 MEDIUM (6 bug) — Fix setelah high priority

| # | Bug | File | Impact | Rekomendasi Fix |
|---|-----|------|--------|----------------|
| **2.4** | **Approval Timestamps Not Cleared on Re-Submit** | `Pumk/PermohonanDanaController.php` | SPJ di-reject lalu di-submit ulang → approval lama (katim_approved_at, dll) masih tampil | Clear semua approval fields saat transition `rejected` → `submitted` |
| **2.5** | **Snapshot Not Cleared on `hapusBuktiBayar`** | `Bendahara/PermohonanDanaController.php` | Bukti bayar dihapus → status balik ke `pic_approved`, tapi snapshot `dicairkan_by_name` masih ada | Clear `dicairkan_by_name` dan `dicairkan_by_nip` saat `hapusBuktiBayar()` |
| **1.2** | **Cache Invalidation Gap** | `DjaRincianBiaya.php` | `PermohonanDanaItem` dihapus langsung (bukan via controller) → cache `terpakai` stale 1 menit | Tambah `static::deleted` event di `PermohonanDanaItem` untuk invalidate cache |
| **3.3** | **`terbilang()` Truncates Decimals** | `Exports/NominatifExport.php` | `1,500,000.50` → terbilang "Satu Juta Lima Ratus Ribu" (50 sen hilang) | Round sebelum cast ke `int`, atau extend `terbilang()` untuk handle desimal |
| **4.2** | **Duplicate `dja_rincian_biaya_id` in Request** | `Pumk/PermohonanDanaController.php` | Request kirim rincian sama 2x dengan volume beda → overwrite | Validasi: `items.*.dja_rincian_biaya_id` harus unique dalam array |
| **4.3** | **Rincian Deleted Between Validation & Transaction** | `Pumk/PermohonanDanaController.php` | Admin hapus rincian saat PUMK submit → `$rincian = null` → error PHP ke user | Null check setelah `find()` + pesan error yang user-friendly |

---

### 🟢 LOW (5 bug) — Polish & schema hardening

| # | Bug | File | Impact | Rekomendasi Fix |
|---|-----|------|--------|----------------|
| **1.3** | **Invalid Cache Key dengan NULL ID** | `PermohonanDana.php` | `cache()->forget("dja_rincian__terpakai")` dengan ID kosong → operasi meaningless | Filter NULL sebelum loop: `->pluck(...)->unique()->filter()` |
| **5.3** | **Missing Unique Constraint DJA Hierarchy** | Migration `create_dja_hierarchy_tables` | Bisa ada duplicate kode di bawah parent yang sama | Tambah `$table->unique(['parent_id', 'kode'])` di setiap level |
| **5.4** | **Missing Unique `(pd_id, rincian_id)`** | Migration `rebuild_keuangan_permohonan_dana` | Bisa ada 2 item dengan rincian sama dalam 1 SPJ | Tambah `$table->unique(['permohonan_dana_id', 'dja_rincian_biaya_id'])` |
| **5.5** | **`kode_akun` Nullable** | Migration `rebuild_keuangan_permohonan_dana` | Item tanpa kode akun bisa terbuat via raw insert | Hapus `->nullable()` di `kode_akun` |
| **6.1** | **`generateNomor()` Breaks at 1000+** | `PermohonanDana.php` | Prefix jadi 4 digit, `substr(..., 0, 3)` ambil salah | Parse dengan regex `/^\d+/` bukan fixed substr |
| **6.2** | **Float Precision Loss di `terpakai`** | `DjaRincianBiaya.php` | `(float)` cast untuk triliunan rupiah bisa hilang sen | Return string atau pakai Laravel `decimal:2` cast tanpa re-cast |
| **6.3** | **`tipe_nominatif` Silently Overwritten** | `PermohonanDanaItem.php` | `saving` event selalu overwrite `tipe_nominatif` dari kode_akun | Pastikan `kode_akun` NOT NULL, atau izinkan manual override |

---

## 📊 Ringkasan Severity

| Severity | Jumlah | Status |
|----------|--------|--------|
| 🔴 Critical | 3 | Menunggu eksekusi |
| 🟠 High | 7 | Menunggu eksekusi |
| 🟡 Medium | 6 | Menunggu eksekusi |
| 🟢 Low | 5 | Menunggu eksekusi |
| ✅ Sudah Fix | 5 | Batch 1 selesai |
| **Total** | **26** | **5 fix, 21 menunggu** |

---

## 🗓️ Rekomendasi Urutan Fix

### Sprint 1 (Critical — 1-2 hari)
1. **Bug 3.1** — Cross-SPJ nominatif injection
2. **Bug 3.4** — Export perjadin dalam salah hitung
3. **Verifikasi Bug 1.1/4.1** — Apakah race condition budget masih ada setelah H3?

### Sprint 2 (High — 2-3 hari)
4. **Bug 2.1, 2.2, 2.3** — Approval race conditions (Katim, PIC, Bendahara)
5. **Bug 3.2** — Nominatif snapshot mismatch
6. **Bug 5.2** — Rejection records cascade delete
7. **H0** — `created_by` snapshot

### Sprint 3 (Medium — 2-3 hari)
8. **Bug 2.4, 2.5** — Clear stale approval data
9. **Bug 1.2** — Cache invalidation on direct delete
10. **Bug 4.2, 4.3** — Harden PUMK wizard validation

### Sprint 4 (Low — 1-2 hari)
11. **Bug 5.1, 5.3, 5.4, 5.5** — Database constraints
12. **Bug 1.3, 6.1, 6.2, 6.3** — Edge cases & polish

---

## 📝 Catatan Penting

### H1 (On Hold)
Bug H1 tentang snapshot pagu/SBM masih **on hold** menunggu jawaban stakeholder dari `docs/pertanyaan-validasi-snapshot-keuangan.md`.

### Backfill Command (C3)
Setelah deploy C3, WAJIB jalankan:
```bash
php artisan backfill:approver-snapshots
```
Kalau tidak, SPJ yang di-approve sebelum deploy akan punya kolom snapshot kosong.

### Test Strategy
Setiap bug harus punya regression test di `tests/Feature/Keuangan/`. Pattern yang sudah terbukti:
- Buat test yang reproduksi bug → pastikan fail
- Apply fix → pastikan pass
- Run full suite `php artisan test tests/Feature/Keuangan/` → pastikan no regression

---

*Dokumen ini akan di-update setiap kali batch selesai dieksekusi.*
