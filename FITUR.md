# SIPITUNG — Daftar Fitur & Modul

Sistem Informasi LLDIKTI Wilayah III (SIPITUNG) berbasis Laravel 12 + React 19 + Inertia.js.

---

## Role Pengguna

| Role | Prefix URL | Keterangan |
|---|---|---|
| `super_admin` | `/super-admin/` | Akses penuh ke semua modul |
| `ketua_tim_kerja` | `/ketua-tim/` | Data dibatasi per `tim_kerja_id` |
| `pimpinan` | `/pimpinan/` | Sub-tipe: `kabag_umum` dan `ppk` |
| `bendahara` | `/bendahara/` | Fokus pada pencairan dana |

---

## Modul & Status Implementasi

### ✅ Autentikasi
- Login berbasis **username** (bukan email) via Laravel Fortify
- Two-Factor Authentication (2FA)
- Forgot password & reset password
- Email verification
- Confirm password

### ✅ Perencanaan

#### Perjanjian Kinerja (PK) Awal
| Fitur | Ketua Tim | Pimpinan | Super Admin |
|---|---|---|---|
| Buat / inisialisasi PK Awal | ✅ | — | — |
| Edit sasaran & indikator | ✅ | — | ✅ (view) |
| Submit untuk approval | ✅ | — | — |
| Approve / Reject (Kabag & PPK) | — | ✅ | — |
| Reopen PK yang sudah disetujui | — | — | ✅ |
| Lihat progress & status | ✅ | ✅ | ✅ |

Alur status: `draft → submitted → kabag_approved → ppk_approved` / `rejected`

#### Perjanjian Kinerja (PK) Revisi
- Alur dan fitur identik dengan PK Awal
- Digunakan untuk merevisi target kinerja di tengah tahun anggaran

#### Rencana Aksi (RA)
| Fitur | Ketua Tim | Pimpinan | Super Admin |
|---|---|---|---|
| Inisialisasi RA dari PK Awal | ✅ | — | — |
| Tambah / edit / hapus indikator RA | ✅ | — | ✅ (view) |
| Submit untuk approval | ✅ | — | — |
| Approve / Reject | — | ✅ | — |
| Reopen RA | — | — | ✅ |
| Lihat progress | ✅ | ✅ | ✅ |

> Sasaran RA diambil dari PK Awal via `rencana_aksi_indikator.sasaran_id`

---

### ✅ Keuangan — Permohonan Dana

Alur status: `draft → submitted → approved_kabag → approved_ppk → cek → cair` / `rejected`

| Fitur | Ketua Tim | Pimpinan (Kabag/PPK) | Bendahara | Super Admin |
|---|---|---|---|---|
| Buat permohonan dana | ✅ | — | — | — |
| Edit / hapus (draft & rejected) | ✅ | — | — | — |
| Submit permohonan | ✅ | — | — | — |
| Approve / Reject (Kabag) | — | ✅ (kabag) | — | — |
| Approve / Reject (PPK) | — | ✅ (ppk) | — | — |
| Verifikasi / Cek | — | — | ✅ | — |
| Pencairan dana | — | — | ✅ | — |
| Lihat daftar permohonan | ✅ | ✅ | ✅ | ✅ |

---

### ✅ Data Master *(Super Admin)*

| Fitur | Keterangan |
|---|---|
| Manajemen User | CRUD, toggle aktif/nonaktif, reset password |
| Manajemen Tahun Anggaran | CRUD, set tahun default |
| Kategori | *Stub — belum diimplementasi* |
| Template Dokumen | *Stub — belum diimplementasi* |

---

### 🚧 Modul Belum Diimplementasi

| Modul | Status | Keterangan |
|---|---|---|
| **Pengukuran** | Stub | Route tersedia, UI & logic belum ada |
| **Pertanggungjawaban / LPJ** | Stub | Route tersedia, halaman kosong |
| **Validasi** | Stub | Route tersedia, halaman kosong |
| **Dokumen** | Stub | Route tersedia, halaman kosong |
| **Laporan** | Stub | Route tersedia, UI minimal |

---

## Struktur File Utama

```
routes/
├── web.php                          # Root routing + redirect
├── settings.php                     # Pengaturan akun
└── roles/
    ├── super-admin.php
    ├── ketua-tim.php
    ├── pimpinan.php
    └── bendahara.php

app/Http/Controllers/
├── SuperAdmin/
│   ├── PerencanaanController.php
│   ├── DataMasterController.php
│   ├── UserController.php
│   └── TahunAnggaranController.php
├── KetuaTim/
│   ├── DashboardController.php
│   ├── PerencanaanController.php
│   └── PermohonanDanaController.php
├── Pimpinan/
│   ├── DashboardController.php
│   ├── PerencanaanController.php
│   └── PermohonanDanaController.php
└── Bendahara/
    ├── DashboardController.php
    └── PermohonanDanaController.php

app/Models/
├── User.php
├── TimKerja.php
├── TahunAnggaran.php
├── PerjanjianKinerja.php
├── Sasaran.php
├── IndikatorKinerja.php
├── RencanaAksi.php
├── RencanaAksiIndikator.php
├── PermohonanDana.php
└── PermohonanDanaItem.php

resources/js/pages/
├── auth/                            # Login, 2FA, reset password
├── settings/                        # Tampilan & preferensi
├── SuperAdmin/
│   ├── Dashboard.tsx
│   ├── DataMaster/
│   └── Perencanaan/
│       ├── PerjanjianKinerja/Awal/
│       ├── PerjanjianKinerja/Revisi/
│       └── RencanaAksi/
├── KetuaTim/
│   ├── Dashboard.tsx
│   ├── Perencanaan/
│   └── PermohonanDana/
├── Pimpinan/
│   ├── Dashboard.tsx
│   ├── Perencanaan/
│   └── PermohonanDana/
└── Bendahara/
    ├── Dashboard.tsx
    └── PermohonanDana/
```

---

## Model & Relasi Kunci

```
TahunAnggaran
    └── PerjanjianKinerja (jenis: awal / revisi)
            └── Sasaran
                    └── IndikatorKinerja
                            └── RencanaAksiIndikator
                                    └── RencanaAksi

TimKerja
    ├── User (ketua_tim_kerja)
    ├── PerjanjianKinerja
    └── PermohonanDana
            └── PermohonanDanaItem
```

---

## Navigasi per Role

| Role | Menu Utama |
|---|---|
| Super Admin | Dashboard, Perencanaan (PK+RA), Keuangan, Data Master, Notifikasi |
| Ketua Tim | Dashboard, Perencanaan (PK+RA), Keuangan, Dokumen, Notifikasi |
| Pimpinan | Dashboard, Perencanaan (approval), Keuangan (approval), Laporan, Notifikasi |
| Bendahara | Dashboard, Permohonan Dana, Verifikasi LPJ, Laporan, Notifikasi |