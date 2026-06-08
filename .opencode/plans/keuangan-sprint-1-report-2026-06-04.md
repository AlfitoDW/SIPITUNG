# Keuangan Live Lookup Audit — Execution Report

> **Tanggal:** 2026-06-04  
> **Scope:** Sprint 1 (Kapokja + PIC Keuangan snapshot + Approver pure live fix + NominatifExport fuzzy removal)  
> **Status:** ✅ COMPLETE  
> **Tests:** 83 passed, 316 assertions, 1.29s

---

## ✅ Sprint 1 — COMPLETE

### 1. Migration: Kapokja + PIC Snapshot
- **File:** `database/migrations/2026_06_04_500001_add_kapokja_pic_snapshots.php`
- **Kolom baru:**
  - `kapokja_name`, `kapokja_nip`
  - `pic_keuangan_name`, `pic_keuangan_nip`

### 2. Model Update
- **File:** `app/Models/PermohonanDana.php`
- **Change:** `$fillable` extended dengan 4 kolom snapshot baru

### 3. Controller Updates (6 controllers)
- **Pumk:** `updateStep2()` now writes kapokja + PIC snapshot
- **Semua controller index/show/print:** baca snapshot, hapus live relation
- **Controllers affected:**
  - `Pumk/PermohonanDanaController.php`
  - `SuperAdmin/KeuanganController.php`
  - `Pimpinan/PermohonanDanaController.php`
  - `PicKeuangan/PermohonanDanaController.php`
  - `Bendahara/PermohonanDanaController.php`
  - `KetuaTim/PermohonanDanaController.php`

### 4. Approver Pure Live Fix
- **SuperAdmin `show()`:** Ganti `$pd->katimApprovedBy?->nama_lengkap` → `$pd->katim_approved_by_name`
- **KetuaTim `show()`:** Ganti pure live relation ke snapshot
- **Semua controller:** Hapus `with('katimApprovedBy', ...)` dari query (reduce N+1)

### 5. Approver Fallback Removal
- **Pattern:** Hapus `$pd->xxx_approved_by_name ?? $pd->xxxApprovedBy?->nama_lengkap`
- **Jadi:** `$pd->xxx_approved_by_name` saja (snapshot only)
- **Controllers:** Pumk, Pimpinan, PicKeuangan, Bendahara

### 6. NominatifExport Fuzzy Lookup Removal
- **File:** `app/Exports/NominatifExport.php`
- **Hapus:** `lookupNipFromRefNama()` method entirely
- **Hapus:** Fallback live `$this->ppk?->nama_lengkap`, `$this->bendahara?->nama_lengkap`
- **Jadi:** Pure snapshot `$this->pd->ppk_approved_by_name`, `$this->pd->dicairkan_by_name`

### 7. Backfill Command
- **File:** `app/Console/Commands/BackfillApproverSnapshots.php`
- **Extend:** Tambah 2 step untuk kapokja + PIC snapshot
- **Usage:** `php artisan backfill:approver-snapshots`

### 8. Tests
- **File:** `tests/Feature/Keuangan/KapokjaPicSnapshotTest.php`
- **5 tests:**
  1. Snapshot tersimpan saat update step 2
  2. Snapshot survive kapokja name change
  3. Snapshot survive kapokja deletion
  4. Controller baca snapshot (bukan live)
  5. No fallback ke live relation kalau snapshot null

---

## 📊 Test Results

```
Tests:    83 passed (316 assertions)
Duration: 1.29s
```

All keuangan tests pass. No regression.

---

## 🗓️ Sisa Sprint (On Hold / Next)

| Sprint | Scope | Status |
|--------|-------|--------|
| Sprint 2 | Tim Kerja snapshot (16 tempat) | Pending |
| Sprint 3 | DJA Hierarchy snapshot (8 tempat) | Pending |
| Sprint 4 | Bukti Bayar + Pembukaan Kunci snapshot (6 tempat) | Pending |
| H1 | Snapshot pagu/SBM | On hold — tunggu stakeholder answers |

---

*Report generated automatically after Sprint 1 execution.*
