# Dokumentasi Modul & Flow Aplikasi SIPITUNG

Sistem Informasi Pengelolaan Anggaran — berbasis CodeIgniter 3, digunakan oleh organisasi pemerintah (LLDIKTI) untuk mengelola permohonan dan approval dana anggaran secara bertingkat.

---

## Daftar Isi

1. [Arsitektur Sistem](#1-arsitektur-sistem)
2. [Role & Hak Akses](#2-role--hak-akses)
3. [Modul Autentikasi](#3-modul-autentikasi)
4. [Modul Dashboard](#4-modul-dashboard)
5. [Modul Permohonan Dana](#5-modul-permohonan-dana)
6. [Modul Struktur Anggaran (TreeView)](#6-modul-struktur-anggaran-treeview)
7. [Modul TOR & RAB](#7-modul-tor--rab)
8. [Modul User Management](#8-modul-user-management)
9. [Skema Database](#9-skema-database)
10. [Relasi Antar Modul](#10-relasi-antar-modul)
11. [Catatan Implementasi](#11-catatan-implementasi)

---

## 1. Arsitektur Sistem

```
Browser
  └─ CodeIgniter 3 (PHP)
      ├─ Controllers/
      │   ├─ Auth.php             → Login & sesi
      │   ├─ Welcome.php          → Dashboard
      │   ├─ Permohonan_dana.php  → Core bisnis
      │   ├─ TreeView.php         → Hierarki anggaran (AJAX)
      │   ├─ Tor_rab.php          → TOR & RAB
      │   └─ User.php             → Manajemen user
      ├─ Models/
      │   ├─ ModelApp.php         → Base model (autonumber, format)
      │   ├─ PermohonanModel.php  → Logika utama permohonan dana
      │   ├─ Treeview_model.php   → Query hierarki anggaran
      │   ├─ AuthModel.php        → Validasi login
      │   ├─ UserModel.php        → CRUD user
      │   ├─ Program_model.php    → CRUD Program
      │   ├─ Sasaran_model.php    → CRUD Sasaran
      │   ├─ KRO_model.php        → CRUD KRO
      │   ├─ RO_model.php         → CRUD RO
      │   ├─ Komponen_model.php   → CRUD Komponen
      │   ├─ Kegiatan_model.php   → CRUD Kegiatan
      │   ├─ Subkegiatan_model.php→ CRUD Sub-Kegiatan
      │   ├─ Rincian_model.php    → CRUD Rincian
      │   ├─ Dokumen_model.php    → Upload & ambil dokumen
      │   ├─ PosisiModel.php      → Posisi/saldo anggaran
      │   └─ M_tor.php            → CRUD TOR
      ├─ Helpers/
      │   ├─ sibuk2_helper.php    → Guard: cek_login(), cek_posisi()
      │   ├─ terbilang_helper.php → Angka ke teks Indonesia
      │   ├─ alert_helper.php     → Flash message
      │   └─ iku_helper.php       → Deskripsi IKU
      └─ Libraries/
          ├─ PHPExcel             → Export ke Excel
          └─ Template.php         → Layout view
```

### Tech Stack Saat Ini
| Komponen | Teknologi |
|----------|-----------|
| Backend | PHP 8.5 + CodeIgniter 3 |
| Database | MySQL 9.6 |
| Export Excel | PHPExcel |
| Export Word | PhpOffice/PhpWord |
| Frontend | Bootstrap + jQuery + AJAX |
| Web Server | PHP Built-in / Apache |

---

## 2. Role & Hak Akses

### Hierarki Role

```
ADMIN (0)
  └─ KPA - Kuasa Pengguna Anggaran (1)
       └─ PPK - Pejabat Pembuat Komitmen (2)
            └─ KABAG - Kepala Bagian Umum (3)
                 └─ BP - Bendahara Pengeluaran (4)
                 └─ PIC - Penanggungjawab Keuangan (5)
                 └─ KA.TIM - Ketua Tim Kerja (6)
                      └─ PUMK - Pemegang Uang Muka Kerja (7)
                 └─ KA.TIM KEU - Ketua Tim Keuangan (8)
```

### Mapping Role ke Fungsi

| Role | ID | Buat Permohonan | Approve | Lihat Semua | Kelola User | Kelola Anggaran |
|------|----|:-:|:-:|:-:|:-:|:-:|
| ADMIN | 0 | - | - | ✓ | ✓ | ✓ |
| KPA | 1 | - | - | ✓ | ✓ | ✓ |
| PPK | 2 | - | ✓ | ✓ | - | - |
| KABAG | 3 | - | ✓ | ✓ | - | - |
| BP | 4 | - | ✓ | ✓ | - | - |
| PIC | 5 | - | ✓ | Unit | - | - |
| KA.TIM | 6 | - | ✓ | Unit | - | - |
| PUMK | 7 | ✓ | - | Unit | - | - |
| KA.TIM KEU | 8 | - | ✓ | ✓ | - | - |

### Session Data Setelah Login

```json
{
  "uname":    "username",
  "posisi":   "jabatan user",
  "role":     "0-8",
  "nama":     "nama lengkap",
  "id_user":  123,
  "unitcode": "kode_unit",
  "unitname": "nama_unit",
  "akses":    "0-3",
  "TA":       "2024"
}
```

---

## 3. Modul Autentikasi

**Controller:** `Auth.php`
**Model:** `AuthModel.php`

### Flow Login

```
1. User buka aplikasi
      ↓
2. Cek session → sudah login? → redirect Dashboard
      ↓ (belum)
3. Tampil form login (username, password, tahun anggaran)
      ↓
4. POST → Auth::login2()
      ↓
5. Query tabel user:
     WHERE username = ? AND password = ? AND is_aktive = '1'
      ↓
6. Tidak ditemukan? → alert error, kembali ke login
      ↓ (ditemukan)
7. Set session data (uname, role, nama, id_user, unitcode, TA, dst)
      ↓
8. Redirect ke Welcome::dashboard()
```

### Fitur Lain

| Fungsi | Flow |
|--------|------|
| **Logout** | Destroy session → redirect login |
| **Ubah Tahun Anggaran** | Update `TA` di session tanpa logout, redirect ke halaman sebelumnya |
| **Reset Password** | Stub/belum diimplementasikan |

### Field Tabel `user` yang Terlibat

```
username    → input login
password    → input login (plaintext)
secure      → username+password (concatenation)
is_aktive   → harus '1' agar bisa login
role        → disimpan ke session
kode_unit   → disimpan ke session
```

---

## 4. Modul Dashboard

**Controller:** `Welcome.php`
**Model:** `PermohonanModel.php`

### Flow Dashboard

```
1. cek_login() → redirect Auth jika belum login
      ↓
2. Ambil role & id_user dari session
      ↓
3. Query permohonan berdasarkan role:
     - Role 6, 7   → filter by penanggung_jawab atau dibuat_oleh
     - Role 2,3,4,5,8 → filter by perlu_aproval sesuai role
     - Role 0, 1   → lihat semua
      ↓
4. Hitung counter status:
     totalDraft      → status = 'draft'
     totalProses     → menunggu approval dari role user ini
     totalDiajukan   → status = 'diajukan'
     totalRevisi     → status = 'revisi'
     totalSelesai    → status = 'selesai'
      ↓
5. Render view dashboard dengan data
```

### Mapping `perlu_aproval` ke Role

| Nilai `perlu_aproval` | Role yang Handle |
|-----------------------|-----------------|
| `kapokja bagian` | KA.TIM (6) |
| `kapokja keuangan` | KA.TIM KEU (8) |
| `kabag umum` | KABAG (3) |
| `ppk` | PPK (2) |
| `pic keuangan` | PIC (5) |
| `bendahara` | BP (4) |
| `pumk` | PUMK (7) |

---

## 5. Modul Permohonan Dana

**Controller:** `Permohonan_dana.php`
**Model:** `PermohonanModel.php`, `Dokumen_model.php`

### Diagram Status Permohonan

```
          PUMK
            │
            ▼
[DRAFT] ──────────────────────────────────────────────────────────
            │ Submit (ajukanDraft)
            ▼
[DIAJUKAN] perlu_aproval = 'kapokja bagian'
            │
            ├── Tolak ──→ [REVISI] → PUMK edit & resubmit ──┐
            │                                                │
            ▼ Setuju                                         │
[DIAJUKAN] perlu_aproval = 'kapokja keuangan'                │
            │                                                │
            ├── Tolak ──→ [REVISI] ────────────────────────→ ┤
            │                                                │
            ▼ Setuju                                         │
[DIAJUKAN] perlu_aproval = 'kabag umum'                      │
            │                                                │
            ├── Tolak ──→ [REVISI] ────────────────────────→ ┤
            │                                                │
            ▼ Setuju                                         │
[DIAJUKAN] perlu_aproval = 'ppk'                             │
            │                                                │
            ├── Tolak ──→ [REVISI] ────────────────────────→ ┤
            │                                                │
            ▼ Setuju                                         │
[DIAJUKAN] perlu_aproval = 'pic keuangan'                    │
            │                                                │
            ├── Tolak ──→ [REVISI] ────────────────────────→ ┤
            │                                                │
            ▼ Setuju                                         │
[DIAJUKAN] perlu_aproval = 'bendahara'                       │
            │                                                │
            ├── Tolak ──→ [REVISI] ────────────────────────→ ┘
            │
            ▼ Setuju (Approval Terakhir)
         [SELESAI]
```

### Flow Membuat Permohonan (PUMK)

```
1. PUMK buka form permohonan baru
      ↓
2. Pilih hierarki anggaran via TreeView AJAX:
     Program → Sasaran → KRO → RO → Komponen → Kegiatan
      ↓
3. Isi data kegiatan:
     - Judul kegiatan
     - Tanggal pelaksanaan (mulai & selesai)
     - Jam pelaksanaan
     - Tempat
     - Penanggung jawab (pilih KA.TIM)
     - PIC keuangan
      ↓
4. Tambah item anggaran:
     a. Item Reguler (detail_anggaran):
          - Pilih sub-kegiatan & rincian
          - Input volume, harga satuan
          - Sistem hitung total otomatis
     b. Item Referensi/Pegawai (detail_anggaran_ref):
          - Pilih pegawai dari ref_nama
          - Input volume, satuan, honor
          - PPh21 dihitung otomatis
      ↓
5. Upload dokumen pendukung (dok_pendukung)
      ↓
6. Simpan sebagai DRAFT
     - Insert ke permohonan_dana (status='draft')
     - Insert ke detail_anggaran & detail_anggaran_ref
     - Insert ke dok_pendukung
     - Generate no_permohonan (autonumber)
      ↓
7. Ajukan (Submit)
     - Update status = 'diajukan'
     - Set perlu_aproval = 'kapokja bagian'
     - Insert ke histori_ajuan
```

### Flow Approval

```
1. Approver login → lihat permohonan di dashboard
     (filter: perlu_aproval sesuai role approver)
      ↓
2. Klik detail permohonan → review:
     - Data kegiatan
     - Breakdown anggaran
     - Dokumen pendukung
     - Riwayat histori
      ↓
3. Decision:
     A. SETUJU:
          UPDATE permohonan_dana SET
            perlu_aproval = [role berikutnya]
          INSERT histori_ajuan (status='disetujui', catatan, id_user)

     B. TOLAK / REVISI:
          UPDATE permohonan_dana SET status='revisi'
          INSERT histori_ajuan (status='ditolak', catatan, id_user)
          PUMK mendapat notifikasi untuk revisi

     C. APPROVAL TERAKHIR (BP/Bendahara):
          UPDATE permohonan_dana SET
            status='selesai', perlu_aproval=''
          INSERT histori_ajuan (status='disetujui')
```

### Flow Edit & Kelola Anggaran

```
editAnggaran()
  ↓
Tampil form edit dengan data existing
  ↓
Update detail_anggaran / detail_anggaran_ref
  ↓
simpanAnggaran()
  ├─ Hapus detail lama
  ├─ Insert detail baru
  └─ Simpan snapshot ke histori_anggaran
```

### Fitur Export & Dokumen

| Fungsi | Output |
|--------|--------|
| `exportToExcel()` | Rekap anggaran permohonan → `.xlsx` |
| `cetakAjuan()` | Print/cetak ajuan permohonan |
| `buatTanggalNominative()` | Generate daftar nominatif pegawai |
| `do_Upload()` | Upload dokumen pendukung ke server |
| `preview_file()` | Preview dokumen yang sudah diupload |

### Tipe Dokumen Pendukung

| ID | Nama Dokumen |
|----|-------------|
| 1 | SK / Surat Keputusan |
| 2 | ST / Surat Tugas |
| 3 | Bukti Bayar |
| 4 | Laporan Pertanggungjawaban (LPJ) |
| 5 | Dokumen lainnya |

---

## 6. Modul Struktur Anggaran (TreeView)

**Controller:** `TreeView.php`
**Model:** `Treeview_model.php`, dan model per entitas

### Hierarki Data Anggaran

```
Program (tahun_anggaran)
  └─ Sasaran
       └─ KRO (Klarifikasi Rincian Output)
            └─ RO (Rincian Output)
                 └─ Komponen
                      └─ Kegiatan
                           └─ Sub-Kegiatan
                                └─ Rincian Sub-Kegiatan (Master Anggaran)
                                     ├─ volume (default)
                                     ├─ harga_satuan
                                     └─ satuan
```

### Flow AJAX Cascading Dropdown

```
1. Load halaman → getPrograms() → tampil daftar Program (filter TA)
      ↓ Pilih Program
2. getSasarans(id_program) → tampil Sasaran
      ↓ Pilih Sasaran
3. getKros(id_sasaran) → tampil KRO
      ↓ Pilih KRO
4. getRos(id_kro) → tampil RO
      ↓ Pilih RO
5. getKomponens(id_ro) → tampil Komponen
      ↓ Pilih Komponen
6. getKegiatans(id_komponen) → tampil Kegiatan
      ↓ Pilih Kegiatan
7. getSubkegiatans(id_kegiatan) → tampil Sub-Kegiatan
      ↓ Pilih Sub-Kegiatan
8. getRincianSubkegiatans(id_subkegiatan) → tampil Rincian/item anggaran
     Setiap item berisi: nama pekerjaan, volume default, harga_satuan
```

### CRUD Hierarki Anggaran

Setiap level memiliki controller & model tersendiri:

| Level | Controller | Operasi |
|-------|-----------|---------|
| Program | Program.php | Insert, Update, Hapus, Import Excel |
| Sasaran | Sasaran.php | Insert, Update, Hapus |
| KRO | Kro.php | Insert, Update, Hapus |
| RO | Ro.php | Insert, Update, Hapus |
| Komponen | Komponen.php | Insert, Update, Hapus |
| Kegiatan | Kegiatan.php | Insert, Update, Hapus |
| Sub-Kegiatan | Pekerjaan.php | Insert, Update, Hapus |
| Rincian | Rincian.php | Insert, Update, Hapus |

### Edit Master Anggaran (inline di TreeView)

```
1. Klik edit di node Rincian Sub-Kegiatan
      ↓
2. AJAX GET → editAnggaran(id_pekerjaan)
     Return: { pekerjaan_name, volume, harga_satuan, satuan }
      ↓
3. Tampil inline form edit
      ↓
4. POST → updateMasterAnggaran()
     UPDATE rincian_subkegiatan SET volume=?, harga_satuan=? WHERE id=?
```

### Catatan: Dual Year Support

```
TA >= 2024 → query menggunakan kode_* (kode_program, kode_sasaran, dst.)
TA < 2024  → query menggunakan id_* (id_program, id_sasaran, dst.)
```

---

## 7. Modul TOR & RAB

**Controller:** `Tor_rab.php`
**Model:** `M_tor.php`
**Library:** PhpOffice/PhpWord

### Flow Tambah TOR

```
1. Buka form TOR baru
      ↓
2. Isi data:
     - Program, Sasaran, KRO, RO, Kegiatan
     - IKU (Indikator Kinerja Utama) → array JSON
     - Jenis output & satuan
     - Volume output
     - Latar belakang (rich text)
     - Dasar hukum
     - Gambaran umum
     - Penerima manfaat
     - Metode pelaksanaan
     - Tahapan & waktu pelaksanaan
     - Waktu pencapaian per bulan (sub-komponen × 12 bulan) → JSON
     - Biaya yang diperlukan
      ↓
3. Simpan → M_tor::simpan_data()
     - Proses array sub_komp[] + bulan[] → encode JSON
     - Insert ke tabel tor dengan id_user dari session
```

### Flow Export TOR ke Word

```
1. Klik export → Tor_rab::export_tor_ke_word($id)
      ↓
2. Query data TOR dari database
      ↓
3. Inisialisasi PhpWord
      ↓
4. Generate dokumen Word dengan struktur:
     ┌─────────────────────────────────────────┐
     │ KAK/TOR KEGIATAN                        │
     │ Kementerian / Unit / Tahun Anggaran      │
     ├─────────────────────────────────────────┤
     │ Program, Sasaran, KRO, RO               │
     │ Kegiatan, IKU, Output, Volume           │
     ├─────────────────────────────────────────┤
     │ A. Latar Belakang                       │
     │    1. Dasar Hukum                       │
     │    2. Gambaran Umum                     │
     │ B. Penerima Manfaat                     │
     │ C. Strategi Pencapaian                  │
     │    1. Metode Pelaksanaan                │
     │    2. Tahapan & Waktu Pelaksanaan       │
     │ D. Waktu Pencapaian Keluaran            │
     │    [Tabel 12 bulan × sub-komponen]      │
     │ E. Biaya yang Diperlukan                │
     ├─────────────────────────────────────────┤
     │ Tanda tangan & NIP                      │
     └─────────────────────────────────────────┘
      ↓
5. Download sebagai file .docx
```

### Struktur Tabel `tor`

```
id               → PK
program          → nama program
sasaran          → sasaran program
kro              → KRO
ro               → RO
kegiatan         → nama kegiatan
iku              → JSON: array IKU
jenis_output_satuan → jenis output
volume           → volume output
latar_belakang   → teks bebas
dasar_hukum      → teks bebas
gambaran_umum    → teks bebas
penerima_manfaat → teks bebas
metode_pelaksanaan → teks bebas
tahapan_waktu_pelaksanaan → teks bebas
waktu_pencapaian_keluaran → JSON: { sub_komp: [jan,feb,...,des] }
biaya_yang_diperlukan → nominal
id_user          → FK ke user
```

---

## 8. Modul User Management

**Controller:** `User.php`
**Model:** `UserModel.php`

### Sub-Modul

#### A. Data User

**Akses:** ADMIN, KPA

```
1. Query semua user dari tabel user
      ↓
2. Tampil dalam tab per role:
     KPA | PPK | KABAG | BP | PIC | KA.TIM | PUMK | KA.TIM KEU
      ↓
3. CRUD:
     - Tambah: input form / import dari Excel
     - Edit: ubahUser() → update data user
     - Aktif/nonaktif: toggle is_aktive
```

**Import User dari Excel:**
```
1. Upload file .xlsx / .xls
      ↓
2. Parse kolom: username, nip, nama, role, unit
      ↓
3. Auto-generate:
     - password = '123' (default)
     - secure = username + '123'
     - akseslevel: 0 jika ADMIN, 2 jika PUMK, 1 lainnya
     - role_name → query dari tabel role
     - nama_unit → query dari tabel unit
     - posisi → query dari tabel posisi
      ↓
4. Batch insert ke tabel user
```

#### B. Referensi Nama / Pegawai

**Akses:** ADMIN (0), PUMK (7), PIC (5)

```
Tabel ref_nama → Master data pegawai yang bisa dipilih
                 saat membuat item anggaran honor/pegawai
```

**Logika PPh21 otomatis:**
```
if status = 'Non PNS':
  if punya NPWP → pph21 = 2.5%
  else          → pph21 = 3%
else (PNS):
  if gol II  → pph21 = 0%
  if gol III → pph21 = 5%
  if gol IV  → pph21 = 15%
```

#### C. Hak Akses (hakAkses)

**Akses:** ADMIN

```
Kelola akses level per user:
  akseslevel = 0 → ADMIN
  akseslevel = 1 → Regular (dapat akses semua menu unitnya)
  akseslevel = 2 → PUMK (akses terbatas)
  akseslevel = 3 → Terbatas
```

#### D. Satuan Kerja

```
Tabel unit → Daftar satuan kerja / unit organisasi
Tabel posisi → Daftar posisi jabatan
```

#### E. Ubah Password

```
1. User input password lama & baru
      ↓
2. Verifikasi password lama cocok di database
      ↓
3. Update password & secure di tabel user
```

---

## 9. Skema Database

### Grup: User & Akses

```
user
├─ id_user (PK, int)
├─ username (varchar 20) — login
├─ password (text) — PLAINTEXT ⚠️
├─ secure (text) — username+password
├─ nama (varchar 50)
├─ posisi (varchar 100)
├─ role (varchar 2) — 0-8
├─ role_name (varchar 50)
├─ kode_unit (varchar 15)
├─ nama_unit (varchar 100)
├─ akseslevel (enum: 0,1,2,3)
├─ is_aktive (enum: 0,1)
└─ nip (varchar 30)

role
├─ roleID (PK)
└─ roleName (varchar)

unit
├─ kodeUnit (PK)
└─ namaUnit (varchar)

posisi
├─ id (PK)
└─ nama_posisi (varchar)

ref_nama (Master Pegawai)
├─ id (PK)
├─ nama, nip, nik, npwp
├─ gol_ruang, status (PNS/Non-PNS)
├─ nama_rekening, norek_bni, namabank
├─ pph21 (decimal) — tarif pajak
└─ email
```

### Grup: Hierarki Anggaran

```
program
├─ id_program (PK)
├─ kode_program (unique)
├─ nama_program
├─ dana_program
└─ tahun_anggaran ← filter utama

sasaran
├─ id_sasaran (PK)
├─ kode_sasaran
├─ sasaran (nama)
├─ dana_sasaran
├─ id_program (FK)
└─ kode_program

kro
├─ id_kro (PK)
├─ kode_kro
├─ kro_name
├─ id_sasaran (FK)
└─ kode_sasaran

ro
├─ id_ro (PK)
├─ kode_ro
├─ ro_name
├─ id_kro (FK)
└─ kode_kro

komponen
├─ id_komponen (PK)
├─ kode_komponen
├─ komponen_name
├─ id_ro (FK)
└─ kode_ro

kegiatan
├─ id_kegiatan (PK)
├─ kode_kegiatan
├─ kegiatan_name
├─ id_komponen (FK)
└─ kode_komponen

sub_kegiatan
├─ id_subkegiatan (PK)
├─ kode_subkegiatan
├─ subkegiatan_name
├─ id_kegiatan (FK)
└─ kode_kegiatan

rincian_subkegiatan ← MASTER ANGGARAN
├─ id_pekerjaan (PK)
├─ kode_pekerjaan
├─ pekerjaan_name (nama item/barang/jasa)
├─ id_subkegiatan (FK)
├─ kode_subkegiatan
├─ volume (default)
├─ harga_satuan
└─ satuan
```

### Grup: Permohonan Dana

```
permohonan_dana ← TABEL UTAMA
├─ id (PK)
├─ no_permohonan (unique, autonumber)
├─ tgl_buat
├─ dibuat_oleh (FK → user.id_user)
├─ id_program, id_sasaran, id_kro, id_ro
├─ id_komponen, id_kegiatan
├─ judul_kegiatan
├─ tgl_pelaksanaan, tgl_pelaksanaan_akhir
├─ jam_pelaksanaan
├─ penanggung_jawab (FK → user.id_user) ← KA.TIM
├─ tempat
├─ tgl_lpj
├─ status_permohonan (draft/diajukan/revisi/selesai)
├─ perlu_aproval (varchar) ← workflow state
├─ pic_keuangan (FK → user.id_user)
├─ filebuktibayar, namadokumen
├─ no_sk, tgl_sk
├─ no_st, tgl_st
└─ nominative (tanggal nominatif)

detail_anggaran ← Item anggaran reguler
├─ id (PK)
├─ id_permohonan_da (FK → permohonan_dana.id)
├─ id_subkegiatan_da (FK)
├─ id_pekerjaan_da (FK → rincian_subkegiatan.id_pekerjaan)
├─ volume_da
├─ harga_satuan_da
└─ total_da (volume × harga)

detail_anggaran_ref ← Item anggaran pegawai/honor
├─ id (PK)
├─ id_permohonan_dar (FK → permohonan_dana.id)
├─ id_subkegiatan_dar (FK)
├─ id_pekerjaan_dar (FK)
├─ id_ref_dar (FK → ref_nama.id) ← pegawai
├─ vol_dar, satuan_dar
├─ harga_satuan_dar (honor)
└─ jml_minta_dar (total diminta)

dok_pendukung ← Dokumen upload
├─ id (PK)
├─ no_permohonan (FK)
├─ id_dokumen (1-5, tipe dokumen)
├─ dokumen (filename)
└─ fullpath (path di server)

histori_ajuan ← Audit trail approval
├─ id_histori (PK)
├─ id_permohonan (FK)
├─ status (diajukan/disetujui/ditolak)
├─ tanggal (timestamp)
├─ catatan (notes approver)
├─ id_user (FK, siapa yang aksi)
└─ eksekutor (nama role)
```

### Tabel History / Snapshot

```
permohonan_dana_histori    → snapshot permohonan_dana
detail_anggaran_histori    → snapshot detail_anggaran
detail_anggaran_ref_histori → snapshot detail_anggaran_ref
```

---

## 10. Relasi Antar Modul

```
┌─────────────┐     login      ┌─────────────┐
│    AUTH     │ ─────────────→ │  DASHBOARD  │
└─────────────┘                └──────┬──────┘
                                      │ lihat permohonan
                                      ▼
                               ┌─────────────────┐
                ┌──────────────│ PERMOHONAN DANA │──────────────┐
                │              └────────┬────────┘              │
                │                       │                       │
                ▼                       ▼                       ▼
         ┌──────────┐          ┌────────────────┐       ┌──────────────┐
         │ TREEVIEW │          │ Upload Dokumen │       │  Export/     │
         │(pilih    │          │ (dok_pendukung)│       │  Cetak       │
         │hierarki) │          └────────────────┘       └──────────────┘
         └──────────┘
                │
                ▼
     Program → Sasaran → KRO → RO
     → Komponen → Kegiatan
     → Sub-Kegiatan → Rincian

┌──────────────┐     data pegawai    ┌─────────────────┐
│     USER     │ ──────────────────→ │ PERMOHONAN DANA │
│ MANAGEMENT  │     (ref_nama)       │ (item honor)    │
└──────────────┘                     └─────────────────┘

┌──────────┐     data kegiatan    ┌─────────────────┐
│  TOR &   │ ───────────────────→ │  (standalone,   │
│   RAB    │                      │  export Word)   │
└──────────┘                      └─────────────────┘
```

### Dependency Data

| Modul | Butuh Data Dari |
|-------|----------------|
| Permohonan Dana | user, program, kegiatan, rincian_subkegiatan, ref_nama |
| Dashboard | permohonan_dana, histori_ajuan |
| TreeView | program, sasaran, kro, ro, komponen, kegiatan, sub_kegiatan, rincian_subkegiatan |
| TOR | tor, user (session) |
| User Management | role, unit, posisi, ref_nama |

---

## 11. Catatan Implementasi

### Guard Akses (sibuk2_helper.php)

Semua controller menggunakan dua fungsi ini di `__construct()`:

```php
// Cek sudah login
cek_login();

// Cek role (max 3 role sekaligus)
cek_posisi('0', '1', '2');
```

### Autonumber Permohonan

Format nomor permohonan dibuat otomatis oleh `ModelApp::autoNomor()`:
```
Format: XXX/UNIT/bulan-romawi/tahun
Contoh: 001/LLDIKTI/IV/2024
```

### Format Tanggal

Semua tampilan tanggal dikonversi ke format Indonesia:
```
2024-04-06 → 06 April 2024   (tanggal_indonesia())
2024-04-06 → April           (bulan_indonesia())
4          → IV              (bulanRomawi())
```

### PPh21 Otomatis

Saat memilih pegawai untuk item honor, tarif PPh21 dihitung dan ditampilkan otomatis berdasarkan golongan & status kepegawaian dari tabel `ref_nama`.

### Export

| Fitur | Library | Output |
|-------|---------|--------|
| Rekap Anggaran | PHPExcel | `.xlsx` |
| TOR/KAK | PhpOffice/PhpWord | `.docx` |
| Daftar Nominatif | PHPExcel | `.xlsx` |
| Cetak Ajuan | HTML print | PDF (via browser) |

### Keamanan (Catatan untuk Rebuild)

| Isu | Lokasi | Rekomendasi |
|-----|--------|-------------|
| Password plaintext | tabel `user` | Gunakan bcrypt/argon2 |
| Role check hardcoded | sibuk2_helper.php | Middleware berbasis tabel |
| SQL mode MySQL | Global config | Set permanen di `my.cnf` |
| Upload tanpa validasi ketat | Permohonan_dana | Validasi MIME type & ukuran |
