# Audit Live Lookups — Master Data Corruption Risk in Keuangan Module

> **Tanggal Audit:** 2026-06-04  
> **Scope:** Semua controller, export, dan view serializer di modul keuangan  
> **Status:** Partial fix (C3 approver snapshot + H0 created_by snapshot done). Sisa: 80+ tempat live lookup berbahaya  
> **Total Risiko:** 87 tempat live lookup yang bisa merusak audit trail

---

## 🔴 CRITICAL — Belum Ada Snapshot (57 tempat)

### 1. Kapokja (8 tempat)
Semua controller baca `$pd->kapokja?->nama_lengkap` live. Kalau kapokja ganti nama → semua SPJ lama ikut berubah.

| File | Line | Pattern | Data |
|------|------|---------|------|
| `SuperAdmin/KeuanganController.php` | 143 | `$pd->kapokja?->nama_lengkap` | nama_lengkap |
| `Pumk/PermohonanDanaController.php` | 67 | `$pd->kapokja?->nama_lengkap` | nama_lengkap |
| `Pimpinan/PermohonanDanaController.php` | 111, 198, 219 | `$pd->kapokja?->nama_lengkap` | nama_lengkap |
| `PicKeuangan/PermohonanDanaController.php` | 44, 130, 151 | `$pd->kapokja?->nama_lengkap` | nama_lengkap |
| `Bendahara/PermohonanDanaController.php` | 50, 137, 162 | `$pd->kapokja?->nama_lengkap` | nama_lengkap |
| `KetuaTim/PermohonanDanaController.php` | 70, 94, 168, 199 | `$pd->kapokja?->nama_lengkap` | nama_lengkap |
| `resources/js/pages/Pumk/PermohonanDana/PrintPreview.tsx` | 192, 315, 319 | `pd.kapokja?.nama_lengkap` | nama_lengkap |

**Fix:** Migration `kapokja_name`, `kapokja_nip` ke `permohonan_dana`. Isi saat wizard step 2 atau `submit()`. Semua display baca snapshot.

---

### 2. PIC Keuangan (7 tempat)
Sama risiko seperti Kapokja. `$pd->picKeuangan?->nama_lengkap` live.

| File | Line | Pattern | Data |
|------|------|---------|------|
| `SuperAdmin/KeuanganController.php` | 57, 144 | `$pd->picKeuangan?->nama_lengkap` | nama_lengkap |
| `Pumk/PermohonanDanaController.php` | 70 | `$pd->picKeuangan?->nama_lengkap` | nama_lengkap |
| `Pimpinan/PermohonanDanaController.php` | 111, 220 | `$pd->picKeuangan?->nama_lengkap` | nama_lengkap |
| `PicKeuangan/PermohonanDanaController.php` | 44, 152 | `$pd->picKeuangan?->nama_lengkap` | nama_lengkap |
| `Bendahara/PermohonanDanaController.php` | 47, 162 | `$pd->picKeuangan?->nama_lengkap` | nama_lengkap |
| `KetuaTim/PermohonanDanaController.php` | 97, 200 | `$pd->picKeuangan?->nama_lengkap` | nama_lengkap |
| `resources/js/pages/Pumk/PermohonanDana/PrintPreview.tsx` | 193 | `pd.pic_keuangan?.nama_lengkap` | nama_lengkap |

**Fix:** Migration `pic_keuangan_name`, `pic_keuangan_nip`. Isi saat wizard step 2. Display baca snapshot.

---

### 3. Tim Kerja (16 tempat)
Baca `$pd->timKerja?->nama`, `$pd->timKerja?->kode`, `$pd->timKerja?->ketua?->nama_lengkap` live.

| File | Line | Pattern | Data |
|------|------|---------|------|
| `SuperAdmin/KeuanganController.php` | 54, 142 | `timKerja?->ketua?->nama_lengkap`, `->nama`, `->kode` | nama, kode, ketua |
| `Pimpinan/PermohonanDanaController.php` | 108, 199, 200 | `timKerja?->ketua?->nama_lengkap`, `->nama`, `->kode` | nama, kode, ketua |
| `PicKeuangan/PermohonanDanaController.php` | 41, 131, 132 | `timKerja?->ketua?->nama_lengkap`, `->nama`, `->kode` | nama, kode, ketua |
| `Bendahara/PermohonanDanaController.php` | 47, 138, 139 | `timKerja?->ketua?->nama_lengkap`, `->nama`, `->kode` | nama, kode, ketua |
| `KetuaTim/PermohonanDanaController.php` | 71, 72, 169, 170 | `timKerja?->nama`, `->kode` | nama, kode |

**Fix:** Migration `tim_kerja_nama`, `tim_kerja_kode`, `tim_kerja_ketua_name`, `tim_kerja_ketua_nip`. Isi saat `store()`. Display baca snapshot.

---

### 4. DJA Hierarchy (8 tempat)
Baca `$pd->djaProgram?->nama`, `$pd->djaSasaran?->nama`, dll live. Kalau nama program/sasaran diubah di DJA → semua SPJ lama tampil nama baru!

| File | Line | Pattern | Data |
|------|------|---------|------|
| `SuperAdmin/KeuanganController.php` | 101, 168-173 | `djaProgram?->nama`, `djaSasaran?->nama`, `djaKro?->nama/kode`, dll | semua nama & kode DJA |
| `Pumk/PermohonanDanaController.php` | 32-33 | `djaProgram`, etc. (loaded in index) | semua relasi DJA |
| `Pimpinan/PermohonanDanaController.php` | 213-218 | `djaProgram?->nama`, `djaSasaran?->nama`, dll | semua nama & kode DJA |
| `PicKeuangan/PermohonanDanaController.php` | 145-150 | `djaProgram?->nama`, `djaSasaran?->nama`, dll | semua nama & kode DJA |
| `Bendahara/PermohonanDanaController.php` | 155-160 | `djaProgram?->nama`, `djaSasaran?->nama`, dll | semua nama & kode DJA |
| `KetuaTim/PermohonanDanaController.php` | 193-198 | `djaProgram?->nama`, `djaSasaran?->nama`, dll | semua nama & kode DJA |
| `resources/js/pages/Pumk/PermohonanDana/PrintPreview.tsx` | 176-181 | `pd.dja_program?.nama`, `pd.dja_sasaran?.nama`, dll | semua nama & kode DJA |
| `resources/js/pages/Pumk/PermohonanDana/Wizard.tsx` | 143-148 | `pd.dja_program?.nama`, etc. | semua nama & kode DJA |

**Fix:** Migration `dja_program_nama`, `dja_sasaran_nama`, `dja_kro_nama`, `dja_ro_nama`, `dja_komponen_nama`, `dja_kegiatan_nama`. Isi saat `store()`. Display baca snapshot.

---

## 🟠 HIGH — Snapshot Ada Tapi Diabaikan / Fallback Live (42 tempat)

### 5. Approver Pure Live (SuperAdmin & KetuaTim — 13 tempat)
Snapshot kolom approver sudah ada (C3 fix), tapi controller ini **abaikan** dan baca live relation.

| Controller | Method | Line | Pattern | Snapshot? |
|-----------|--------|------|---------|-----------|
| `SuperAdmin/KeuanganController` | `showPermohonanDana` | 148-160 | `$pd->katimApprovedBy?->nama_lengkap`, `$pd->kabagApprovedBy?->nama_lengkap`, dll | ✅ Ada, **diabaikan** |
| `KetuaTim/PermohonanDanaController` | `show` | 166, 174, 177, 180, 183, 186 | `$pd->createdBy?->nama_lengkap`, `$pd->katimApprovedBy?->nama_lengkap`, dll | ✅ Ada, **diabaikan** |

**Fix:** Ganti ke `$pd->katim_approved_by_name`, `$pd->kabag_approved_by_name`, dll. Hapus `with('katimApprovedBy', ...)` dari query.

---

### 6. Approver Fallback Live (29 tempat)
Semua controller lain pakai `snapshot ?? live_relation` — fallback ke live kalau snapshot null. Ini berbahaya karena kalau snapshot null (data lama sebelum C3), hasil bisa beda dengan realitas saat approval.

| Controller | Pattern |
|-----------|---------|
| `Bendahara/PermohonanDanaController` | `$pd->xxx_approved_by_name ?? $pd->xxxApprovedBy?->nama_lengkap` (lines 135-147) |
| `PicKeuangan/PermohonanDanaController` | `$pd->xxx_approved_by_name ?? $pd->xxxApprovedBy?->nama_lengkap` (lines 128-139) |
| `Pimpinan/PermohonanDanaController` | `$pd->xxx_approved_by_name ?? $pd->xxxApprovedBy?->nama_lengkap` (lines 196-207) |
| `Pumk/PermohonanDanaController` | `$pd->xxx_approved_by_name ?? $pd->xxxApprovedBy?->nama_lengkap ?? $pd->xxxApprovedBy?->name` (lines 52-57) |

**Fix:** Hapus fallback. Kalau snapshot null, tampil `"-"` atau `"Data tidak tersedia"`. Jangan fallback ke live relation.

---

### 7. NominatifExport Fuzzy Lookup (5 tempat)
`NominatifExport::lookupNipFromRefNama()` — **live fuzzy match by name** ke `RefNama`. Sangat berbahaya:
- Dua orang nama mirip → NIP salah
- `RefNama` dihapus → export error
- Non-deterministic — export tidak reproducible

| File | Line | Pattern |
|------|------|---------|
| `Exports/NominatifExport.php` | 507-518 | `lookupNipFromRefNama($nama)` — `RefNama::where('nama', $nama)->first()?->nip` |
| `Exports/NominatifExport.php` | 494 | `$this->ppk?->nama_lengkap` — fallback |
| `Exports/NominatifExport.php` | 495 | `$this->ppk?->nip` — fallback |
| `Exports/NominatifExport.php` | 497 | `$this->bendahara?->nama_lengkap` — fallback |
| `Exports/NominatifExport.php` | 498 | `$this->bendahara?->nip` — fallback |

**Fix:** Hapus `lookupNipFromRefNama()` seluruhnya. Hapus fallback live di `updateFooter()`. Kalau snapshot NIP null, tampil `"-"`.

---

## 🟡 MEDIUM — Bukti Bayar & Pembukaan Kunci (6 tempat)

### 8. Bukti Bayar Uploader & Pembukaan Kunci Actor
Tidak ada snapshot untuk siapa yang upload bukti bayar atau buka kunci.

| File | Line | Pattern | Data |
|------|------|---------|------|
| `Bendahara/PermohonanDanaController` | 197 | `$pd->buktiBayarUploadedBy?->nama_lengkap` | nama_lengkap |
| `Bendahara/PermohonanDanaController` | 54, 152 | `$pd->dibukaKunciOleh?->nama_lengkap` | nama_lengkap |
| `KetuaTim/PermohonanDanaController` | 82, 190 | `$pd->dibukaKunciOleh?->nama_lengkap` | nama_lengkap |
| `PicKeuangan/PermohonanDanaController` | 48, 143 | `$pd->dibukaKunciOleh?->nama_lengkap` | nama_lengkap |
| `Pimpinan/PermohonanDanaController` | 115, 211 | `$pd->dibukaKunciOleh?->nama_lengkap` | nama_lengkap |
| `SuperAdmin/KeuanganController` | 61, 165 | `$pd->dibukaKunciOleh?->nama_lengkap` | nama_lengkap |

**Fix:** Migration `bukti_bayar_uploaded_by_name`, `dibuka_kunci_by_name`. Isi saat action.

---

## ✅ YANG SUDAH AMAN

| Modul | Status | Catatan |
|-------|--------|---------|
| **Approver (5 step)** | ✅ Snapshot | C3 fix selesai — `katim_approved_by_name`, `kabag_approved_by_name`, `ppk_approved_by_name`, `pic_approved_by_name`, `dicairkan_by_name` |
| **PUMK Pembuat SPJ** | ✅ Snapshot | H0 fix selesai — `created_by_name`, `created_by_nip` |
| **Nominatif Peserta** | ✅ Snapshot | Semua data peserta disimpan di `permohonan_dana_item_nominatif` (nama, nip, nik, npwp, rekening, bank, email, jabatan) |
| **PermohonanDanaItem** | ✅ Partial | `uraian`, `kode_akun`, `harga_satuan` disimpan saat `updateStep4()` |

---

## 📊 Ringkasan Severity

| Severity | Jumlah Tempat | Kategori |
|----------|---------------|----------|
| 🔴 CRITICAL | 57 | Kapokja, PIC Keuangan, Tim Kerja, DJA Hierarchy |
| 🟠 HIGH | 42 | Approver pure live, Approver fallback, NominatifExport fuzzy |
| 🟡 MEDIUM | 6 | Bukti Bayar, Pembukaan Kunci |
| **TOTAL** | **105** | — |

---

## 🗓️ Rekomendasi Urutan Fix

### Sprint 1 (Critical — 2-3 hari)
1. **Migration:** `kapokja_name`, `kapokja_nip`, `pic_keuangan_name`, `pic_keuangan_nip`
2. **Controller:** Update 6 controller `show()` / `print()` untuk baca snapshot approver (C3 yang diabaikan)
3. **Controller:** Update `submit()` dan wizard untuk isi Kapokja + PIC snapshot
4. **Export:** Hapus `lookupNipFromRefNama()` dan fallback live di `NominatifExport`

### Sprint 2 (Critical — 2-3 hari)
5. **Migration:** `tim_kerja_nama`, `tim_kerja_kode`, `tim_kerja_ketua_name`, `tim_kerja_ketua_nip`
6. **Controller:** Update `store()` untuk isi Tim Kerja snapshot
7. **Controller:** Update semua display untuk baca Tim Kerja snapshot

### Sprint 3 (Critical — 2-3 hari)
8. **Migration:** `dja_program_nama`, `dja_sasaran_nama`, `dja_kro_nama`, `dja_ro_nama`, `dja_komponen_nama`, `dja_kegiatan_nama`
9. **Controller:** Update `store()` untuk isi DJA snapshot
10. **Controller:** Update semua display untuk baca DJA snapshot

### Sprint 4 (Medium — 1 hari)
11. **Migration:** `bukti_bayar_uploaded_by_name`, `dibuka_kunci_by_name`
12. **Controller:** Update action methods untuk isi snapshot

---

## 📝 Catatan Penting

### H1 (On Hold)
Bug H1 tentang snapshot pagu/SBM masih **on hold** menunggu jawaban stakeholder dari `docs/pertanyaan-validasi-snapshot-keuangan.md`.

### Backfill Strategy
Setiap batch butuh backfill command untuk data lama. Pattern yang sudah terbukti:
```bash
php artisan backfill:approver-snapshots  # sudah ada, tinggal extend
```

### Test Strategy
Setiap snapshot batch harus punya regression test. Pattern:
- Test A: Snapshot tersimpan saat action
- Test B: Snapshot tetap benar walau master data berubah
- Test C: Snapshot tetap benar walau master data dihapus
- Test D: Full suite pass, no regression

---

*Dokumen ini akan di-update setiap kali batch selesai dieksekusi.*
