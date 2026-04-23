# Alur Perencanaan & Pengukuran Kinerja
## Sistem Informasi LLDIKTI 3

---

## Daftar Isi

1. [Ringkasan Modul](#1-ringkasan-modul)
2. [Aktor & Peran](#2-aktor--peran)
3. [Modul Perencanaan](#3-modul-perencanaan)
   - [3.1 Perjanjian Kinerja (PK) Awal](#31-perjanjian-kinerja-pk-awal)
   - [3.2 Perjanjian Kinerja (PK) Revisi](#32-perjanjian-kinerja-pk-revisi)
   - [3.3 Rencana Aksi (RA)](#33-rencana-aksi-ra)
4. [Modul Pengukuran Kinerja](#4-modul-pengukuran-kinerja)
   - [4.1 Pengisian Realisasi (KetuaTim)](#41-pengisian-realisasi-ketuatim)
   - [4.2 Monitoring & Review (Pimpinan)](#42-monitoring--review-pimpinan)
   - [4.3 Manajemen Periode (SuperAdmin)](#43-manajemen-periode-superadmin)
5. [Hubungan Antar Modul](#5-hubungan-antar-modul)
6. [Status & Transisi](#6-status--transisi)

---

## 1. Ringkasan Modul

```
PERENCANAAN                       PENGUKURAN KINERJA
─────────────────────────────     ──────────────────────────────────
PK Awal  ──► Approval ──► Kunci   Periode Aktif ──► Input Realisasi
   │                              (per TW)        ──► Submit Laporan
   └──► PK Revisi ──► Approval    Kunci                ──► Pimpinan Review
                                                        ──► SuperAdmin Export
Rencana Aksi ──► Approval ──► Kunci
   │
   └── (diambil dari PK Awal)
```

---

## 2. Aktor & Peran

| Aktor | Role DB | Lingkup Akses |
|---|---|---|
| **SuperAdmin** | `super_admin` | Semua data semua tim kerja; kelola master data; buka kembali dokumen terkunci; kelola periode; export laporan |
| **Ketua Tim Kerja** | `ketua_tim_kerja` | Data tim kerja sendiri; isi target PK & RA; submit dokumen; input realisasi kinerja |
| **Kabag Umum** | `pimpinan` (sub: `kabag_umum`) | Review & approve/reject PK dan RA yang sudah di-submit; view realisasi kinerja |
| **PPK** | `pimpinan` (sub: `ppk`) | View-only di modul Perencanaan (semua status semua tim); view-only realisasi di Pengukuran |

> **Co-PIC:** Satu IKU bisa punya lebih dari satu Tim Kerja sebagai PIC. Primary PIC dan co-PIC sama-sama bisa mengisi target dan realisasi. Realisasi yang pertama diisi mengunci pengisian (first-come locks it).

---

## 3. Modul Perencanaan

### 3.1 Perjanjian Kinerja (PK) Awal

#### Struktur Data
```
perjanjian_kinerja (jenis: 'awal')
  └── sasaran  (S 1, S 2, S 3, S 4 — dari master_sasaran)
        └── indikator_kinerja  (IKU 1.1, IKU 1.2, dst.)
              └── pic_tim_kerjas  (primary + co-PIC via pivot)
```

#### Alur Lengkap

```
[SuperAdmin]                    [Ketua Tim]                  [Kabag Umum]    [PPK]
     │                               │                            │             │
     ▼                               │                            │             │
Kelola Master Sasaran                │                            │             │
(tambah S 1–S 4)                     │                            │             │
     │                               │                            │             │
     ▼                               │                            │             │
Tambah IKU ke PK Awal                │                            │             │
(pilih sasaran master,               │                            │             │
 tentukan PIC tim kerja)             │                            │             │
     │                               │                            │             │
     ▼                               │                            │             │
Status: draft ──────────────────► Isi Target per IKU             │             │
                                  (click-to-edit dialog)          │             │
                                       │                          │             │
                                       ▼                          │             │
                                  Cek: Semua target terisi?       │             │
                                  Ya → tombol Submit muncul       │             │
                                       │                          │             │
                                       ▼                          │             │
                                  Submit ke Kabag Umum ─────────► Review PK    │
                                  (status: submitted)             │             │
                                                         ┌────────┴──────────┐  │
                                                         ▼                   ▼  │
                                                      Setujui             Tolak +│
                                                    (kabag_approved)    Rekomendasi
                                                    = TERKUNCI          (rejected)
                                                         │                  │   │
                                                         │             ◄────┘   │
                                                         │         Ketua Tim    │
                                                         │         revisi &     │
                                                         │         submit ulang │
                                                         │                      │
                                                         ▼                      ▼
                                                    [SuperAdmin]          View semua PK
                                                    Buka Kembali          (semua status,
                                                    (kabag_approved       read-only)
                                                     atau submitted
                                                     → draft)
```

#### Halaman per Aktor

| Aktor | Halaman | URL | Aksi |
|---|---|---|---|
| SuperAdmin | PK Awal Penyusunan | `/super-admin/perencanaan/perjanjian-kinerja/awal/penyusunan` | Tambah/edit/hapus IKU, kelola PIC, kelola sasaran master, buka kembali |
| KetuaTim | PK Awal Penyusunan | `/ketua-tim/perencanaan/perjanjian-kinerja/awal/persiapan` | Isi target per IKU, submit |
| KetuaTim | PK Awal Progress | `/ketua-tim/perencanaan/perjanjian-kinerja/awal/progress` | Lihat status approval |
| Kabag Umum | PK Awal Review | `/pimpinan/perencanaan/perjanjian-kinerja/awal` | Approve/reject (hanya status `submitted`) |
| PPK | PK Awal Review | `/pimpinan/perencanaan/perjanjian-kinerja/awal` | View-only semua status |

---

### 3.2 Perjanjian Kinerja (PK) Revisi

Identik dengan PK Awal, berjalan **paralel dan independen**. Di-seed sebagai copy PK Awal.

```
perjanjian_kinerja (jenis: 'revisi')
  └── (struktur sama dengan PK Awal)
```

Alur approval sama persis: `draft → submitted → kabag_approved (TERKUNCI) | rejected`

| Aktor | URL |
|---|---|
| SuperAdmin | `/super-admin/perencanaan/perjanjian-kinerja/revisi/penyusunan` |
| KetuaTim | `/ketua-tim/perencanaan/perjanjian-kinerja/revisi/persiapan` |
| Pimpinan | `/pimpinan/perencanaan/perjanjian-kinerja/revisi` |

---

### 3.3 Rencana Aksi (RA)

#### Ketergantungan
> **RA mengambil sasaran dari PK Awal.** Jika PK Awal belum ada/kosong, halaman RA menampilkan warning dan pengisian tidak bisa dilakukan.

#### Struktur Data
```
rencana_aksi  (satu per tim kerja per tahun anggaran)
  └── rencana_aksi_indikator
        ├── sasaran_id  (FK → sasaran dari PK Awal)
        ├── target
        ├── target_tw1 / target_tw2 / target_tw3 / target_tw4
        └── pic_tim_kerjas (lookup dari PK Awal)
```

#### Alur Lengkap

```
[SuperAdmin]          [Ketua Tim]                  [Kabag Umum]    [PPK]
     │                     │                            │             │
     ▼                     │                            │             │
View RA (flat table,        │                            │             │
 semua tim, read-only)      │                            │             │
Buka Kembali (jika          │                            │             │
 kabag_approved*)             │                            │             │
                            ▼                            │             │
                       RA Penyusunan                     │             │
                       (sasaran dari PK Awal)            │             │
                            │                            │             │
                            ▼                            │             │
                       Isi per indikator:                │             │
                       - Target tahunan                  │             │
                       - Target TW I, II, III, IV        │             │
                            │                            │             │
                            ▼                            │             │
                       Semua target terisi?              │             │
                       Ya → Submit ke Kabag Umum ───────► Review RA    │
                       (status: submitted)           ┌───┴────────┐    │
                                                     ▼            ▼    │
                                                 Setujui       Tolak + │
                                              (kabag_approved) Rekomendasi
                                              = TERKUNCI       (rejected)
                                                     │             │   │
                                                     │        ◄────┘   │
                                                     │  Ketua Tim      │
                                                     │  revisi         │
                                                     │                 ▼
                                                     │          View semua RA
                                                     │          (semua status,
                                                     │           read-only)
                                                     ▼
                                              [SuperAdmin]
                                              Buka Kembali*
```

> *`raReopen` di controller SuperAdmin saat ini masih cek `ppk_approved` — kemungkinan kode lama yang belum diperbarui sejak alur PPK dihapus dari frontend. Status `ppk_approved` masih ada di ENUM tabel tapi tidak diset oleh Pimpinan controller.

#### Halaman per Aktor

| Aktor | Halaman | URL | Aksi |
|---|---|---|---|
| SuperAdmin | RA Penyusunan | `/super-admin/perencanaan/rencana-aksi/penyusunan` | View semua RA, buka kembali |
| KetuaTim | RA Penyusunan | `/ketua-tim/perencanaan/rencana-aksi/penyusunan` | Isi target + target TW, submit |
| KetuaTim | RA Progress | `/ketua-tim/perencanaan/rencana-aksi/progress` | Lihat status approval |
| Kabag Umum | RA Review | `/pimpinan/perencanaan/rencana-aksi` | Approve/reject (hanya kabag_umum) |
| PPK | RA Review | `/pimpinan/perencanaan/rencana-aksi` | View-only semua status |

---

## 4. Modul Pengukuran Kinerja

### Prasyarat
- PK Awal sudah `kabag_approved` (terkunci)
- RA sudah `kabag_approved` (terkunci)
- SuperAdmin sudah membuat periode pengukuran (TW I/II/III/IV) dan mengaktifkannya

### 4.1 Pengisian Realisasi (KetuaTim)

```
[SuperAdmin]                  [Ketua Tim]
     │                             │
     ▼                             │
Buat Periode (TW I–IV)             │
Toggle Aktif/Nonaktif              │
     │                             │
     └──► Periode Aktif ──────────► Halaman Pengukuran
                                   (index: /ketua-tim/pengukuran)
                                        │
                                        ▼
                                   Lihat daftar IKU
                                   (yang di-PIC-kan ke tim ini,
                                    termasuk co-PIC)
                                        │
                                        ▼
                                   Isi Realisasi per IKU
                                   (periode aktif)
                                   POST /ketua-tim/pengukuran/store
                                        │
                                   ⚠️  Jika co-PIC sudah isi duluan
                                        → TERKUNCI untuk tim ini
                                        │
                                        ▼
                                   Submit Laporan
                                   POST /ketua-tim/pengukuran/submit
                                   (status laporan: submitted)
```

**Aturan Pengisian:**
- Satu IKU per periode hanya bisa diisi **satu nilai resmi** — siapa yang pertama mengisi, dialah yang mengunci (`input_by_tim_kerja_id`)
- Co-PIC bisa melihat data tapi tidak bisa mengubah jika sudah diisi pihak lain
- Field `catatan` opsional, muncul di dialog jika IKU punya lebih dari 1 PIC

### 4.2 Monitoring & Review (Pimpinan)

```
[Pimpinan — Kabag Umum]
     │
     ▼
/pimpinan/pengukuran/kinerja
     │
     ▼
Lihat realisasi semua tim kerja
(view-only, filter periode aktif)
     │
     ▼
Detail dialog per IKU
     │
     ├──► Approve laporan
     │    POST /pimpinan/pengukuran/{laporan}/approve
     │
     ├──► Reject laporan
     │    POST /pimpinan/pengukuran/{laporan}/reject
     │
     └──► Simpan Rekomendasi
          POST /pimpinan/pengukuran/rekomendasi

Export PDF → /pimpinan/pengukuran/export/pdf
```

### 4.3 Manajemen Periode (SuperAdmin)

```
[SuperAdmin]
     │
     ▼
/super-admin/pengukuran (index)
     │
     ├──► Buat Periode baru (TW I/II/III/IV + tahun)
     │    POST /super-admin/pengukuran/periode
     │
     ├──► Toggle Aktif/Nonaktif
     │    PATCH /super-admin/pengukuran/periode/{periode}/toggle
     │    (hanya satu periode boleh aktif sekaligus)
     │
     └──► Lihat Realisasi semua IKU semua tim
          GET /super-admin/pengukuran/realisasi
               │
               ├──► Export Excel (XLS)
               │    GET /super-admin/pengukuran/export/xls
               │
               ├──► Export PDF (semua periode)
               │    GET /super-admin/pengukuran/export/pdf
               │
               └──► Export PDF per TW
                    GET /super-admin/pengukuran/export/tw-pdf
```

---

## 5. Hubungan Antar Modul

```
master_sasaran (SuperAdmin kelola)
     │
     ├──► sasaran (dalam PK Awal setiap tim kerja)
     │         │
     │         └──► indikator_kinerja (IKU)
     │                   │
     │                   ├──► pic_tim_kerjas (pivot — primary & co-PIC)
     │                   │
     │                   └──► DIGUNAKAN OLEH:
     │                         ├── PK Revisi (copy dari PK Awal)
     │                         ├── rencana_aksi_indikator (via sasaran_id)
     │                         └── realisasi_kinerja (pengukuran per periode)
     │
     └──► rencana_aksi (RA)
               └── rencana_aksi_indikator
                     ├── sasaran_id → FK ke sasaran PK Awal
                     ├── target tahunan
                     └── target TW I–IV
```

**Aturan Penting:**
1. RA tidak bisa diisi jika PK Awal kosong (sasaran belum ada)
2. Realisasi kinerja menggunakan IKU dari PK Awal sebagai referensi
3. SuperAdmin adalah satu-satunya yang bisa CRUD IKU dan sasaran master — KetuaTim hanya mengisi target

---

## 6. Status & Transisi

### Status Dokumen Perencanaan (PK Awal, PK Revisi, RA)

```
draft
  │
  │  [KetuaTim] submit
  ▼
submitted
  │
  │  [Kabag Umum] approve        [Kabag Umum] reject + rekomendasi
  ▼                                     │
kabag_approved ◄──────────────────      ▼
(TERKUNCI)                        rejected
  │
  │  [SuperAdmin] buka kembali
  │  (dari submitted atau kabag_approved → draft)
  ▼
draft  (siklus ulang)
```

> PPK hanya melihat — tidak punya aksi approve/reject di modul Perencanaan.

### Tabel Status per Halaman

| Status | KetuaTim | Kabag Umum | PPK | SuperAdmin |
|---|---|---|---|---|
| `draft` | Dapat edit & submit | Tidak terlihat | Dapat lihat | Dapat lihat + Buka Kembali |
| `submitted` | Baca saja + banner "Menunggu Kabag" | Dapat approve/reject | Dapat lihat | Dapat lihat + Buka Kembali |
| `kabag_approved` | TERKUNCI + catatan Kabag | Baca saja | Dapat lihat | Dapat lihat + Buka Kembali |
| `rejected` | Dapat edit & submit ulang | Baca saja | Dapat lihat | Dapat lihat |

### Status Realisasi Kinerja

| Status | Deskripsi |
|---|---|
| Belum diisi | IKU belum ada data realisasi untuk periode aktif |
| Terisi | Sudah ada realisasi, bisa diubah selama periode aktif |
| Terkunci (co-PIC) | PIC lain sudah mengisi duluan |
| Submitted | KetuaTim sudah submit laporan periode ini |

---

## Appendix: Daftar Sasaran & IKU (Seeder Default)

| Kode | Nama Sasaran | IKU | Primary PIC | Co-PIC |
|---|---|---|---|---|
| S 1 | Sasaran 1 | IKU 1.1 | TK-HMK | — |
| S 1 | Sasaran 1 | IKU 1.2 | TK-PENJAMU | TK-KK |
| S 2 | Sasaran 2 | IKU 2.1 | TK-PENJAMU | TK-BELMAWA |
| S 2 | Sasaran 2 | IKU 2.2 | TK-BELMAWA | — |
| S 2 | Sasaran 2 | IKU 2.3 | TK-ADIA | — |
| S 3 | Sasaran 3 | IKU 3.1 | TK-SD | — |
| S 3 | Sasaran 3 | IKU 3.2 | TK-RPM | TK-KK |
| S 4 | Sasaran 4 | IKU 4.1 | TK-PK | — |
| S 4 | Sasaran 4 | IKU 4.2 | TK-PK | — |

---

*Dokumen ini menggambarkan alur berdasarkan implementasi per 2026-04-14.*
