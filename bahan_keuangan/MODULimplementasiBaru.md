# Dokumentasi Modul Keuangan — Implementasi Baru (Laravel 12 + React 19)

Sistem Informasi LLDIKTI 3 — modul keuangan yang dibangun ulang per 2026-04-27.
Menggantikan implementasi SIPITUNG lama (CodeIgniter 3).

---

## Daftar Isi

1. [Tech Stack](#1-tech-stack)
2. [Role & Hak Akses](#2-role--hak-akses)
3. [Alur Status Permohonan Dana](#3-alur-status-permohonan-dana)
4. [Struktur Database](#4-struktur-database)
5. [Controllers](#5-controllers)
6. [Routes](#6-routes)
7. [Frontend Pages](#7-frontend-pages)
8. [Navigasi per Role](#8-navigasi-per-role)
9. [Fitur yang Belum Diimplementasi](#9-fitur-yang-belum-diimplementasi)
10. [Perbandingan dengan SIPITUNG Lama](#10-perbandingan-dengan-sipitung-lama)

---

## 1. Tech Stack

| Komponen | Teknologi |
|---|---|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | React 19, TypeScript (strict) |
| Bridge | Inertia.js (tidak ada REST API — semua data via controller props) |
| UI | shadcn/ui (New York), Radix UI, Tailwind CSS 4 |
| Database | SQLite (dev) / MySQL (prod) |
| ORM | Eloquent |
| Auth | Laravel Fortify (login by username, bukan email) |
| File path alias | `@/*` → `resources/js/*` |

### Konvensi Penting

- Form submit via `useForm()` dari `@inertiajs/react` — bukan `fetch`/`axios`
- Routing via `routes/roles/*.php` terpisah per role
- Middleware `CheckRole` dipakai di semua route berproteksi: `middleware(['auth', 'role:pumk'])`
- Navigation dikonfigurasi per role di `resources/js/config/navigation/*.ts`

---

## 2. Role & Hak Akses

### Daftar Role Keuangan

| Role (DB) | Label | Fungsi dalam Keuangan |
|---|---|---|
| `pumk` | PUMK | Buat, edit, hapus, submit permohonan dana milik timnya |
| `ketua_tim_kerja` | KA.TIM | Step 1 approval — setujui/tolak permohonan tim sendiri |
| `pimpinan` (kabag_umum) | Kabag Umum | Step 2 approval |
| `pimpinan` (ppk) | PPK | Step 3 approval |
| `pic_keuangan` | PIC Keuangan | Step 4 verifikasi sebelum pencairan |
| `bendahara` | Bendahara | Step 5 — eksekusi pencairan dana |
| `super_admin` | Super Admin | Monitoring seluruh permohonan (read-only) |

### Identifikasi User

- **PUMK** terhubung ke tim via `users.tim_kerja_id` — wajib diisi saat buat akun
- **KA.TIM** juga terhubung via `users.tim_kerja_id` (filter approval by tim)
- **PIC Keuangan** tidak butuh `tim_kerja_id` — akses global
- **Bendahara** tidak butuh `tim_kerja_id` — akses global
- Permohonan dimiliki PUMK via `permohonan_dana.created_by = user.id`

### Helper Methods di `User` Model

```php
$user->isPumk()           // role === 'pumk'
$user->isPicKeuangan()    // role === 'pic_keuangan'
$user->isKetuaTimKerja()  // role === 'ketua_tim_kerja'
$user->isBendahara()      // role === 'bendahara'
$user->isPimpinan()       // role === 'pimpinan'
$user->isSuperAdmin()     // role === 'super_admin'
```

---

## 3. Alur Status Permohonan Dana

### Diagram

```
[draft] ──submit──► [submitted]
                         │
               ┌─────────┴─────────┐
               │ KA.TIM (Step 1)   │
               ▼                   ▼ tolak
         [katim_approved]      [rejected] ◄─── rejected_at_step = 'katim'
               │
      ┌────────┴────────┐
      │ Kabag (Step 2)  │
      ▼                 ▼ tolak
[kabag_approved]    [rejected] ◄─── rejected_at_step = 'kabag'
      │
  ┌───┴───┐
  │PPK(3) │
  ▼       ▼ tolak
[ppk_approved] [rejected] ◄─── rejected_at_step = 'ppk'
      │
  ┌───┴──────┐
  │PIC (4)   │
  ▼          ▼ tolak
[pic_approved] [rejected] ◄─── rejected_at_step = 'pic'
      │
  ┌───┴────────┐
  │Bendahara(5)│
  ▼
[dicairkan]
```

### Nilai `status` (Enum)

```
draft | submitted | katim_approved | kabag_approved | ppk_approved | pic_approved | dicairkan | rejected
```

### Aturan Edit

- **Editable:** `draft` dan `rejected` — PUMK dapat revisi dan resubmit
- Saat resubmit dari `rejected`: `rejected_at_step` dan `catatan_penolakan` di-reset ke `null`
- **Tidak editable:** semua status lain — form edit mengembalikan 403

### Status Label (Bahasa Indonesia)

| Status | Label |
|---|---|
| draft | Draft |
| submitted | Menunggu KA.TIM |
| katim_approved | Menunggu Kabag Umum |
| kabag_approved | Menunggu PPK |
| ppk_approved | Menunggu PIC Keuangan |
| pic_approved | Siap Dicairkan |
| dicairkan | Dicairkan |
| rejected | Ditolak |

---

## 4. Struktur Database

### Migration

File: `database/migrations/2026_04_27_000001_rebuild_keuangan_permohonan_dana.php`

Operasi:
- Drop `is_koordinator` dari `tim_kerja` (jika ada)
- Drop tabel `permohonan_dana_item` dan `permohonan_dana` lama
- Buat ulang keduanya dengan skema baru

### Tabel `permohonan_dana`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | |
| tahun_anggaran_id | FK tahun_anggaran | |
| tim_kerja_id | FK tim_kerja | Tim yang mengajukan |
| nomor_permohonan | string unique | Format: `PD/{YYYY}/{seq_3digit}` |
| keperluan | string | Judul/tujuan permohonan |
| tanggal_mulai | date | |
| tanggal_selesai | date | |
| tempat | string nullable | |
| no_sk | string nullable | Nomor SK kegiatan |
| tgl_sk | date nullable | Tanggal SK |
| no_st | string nullable | Nomor Surat Tugas |
| tgl_st | date nullable | Tanggal Surat Tugas |
| keterangan | text nullable | Keterangan tambahan |
| total_anggaran | decimal(15,2) | Dihitung dari sum items — tidak dari input |
| status | enum | Lihat nilai di atas |
| katim_approved_by | FK users nullable | |
| catatan_katim | text nullable | |
| kabag_approved_by | FK users nullable | |
| catatan_kabag | text nullable | |
| ppk_approved_by | FK users nullable | |
| catatan_ppk | text nullable | |
| pic_approved_by | FK users nullable | |
| catatan_pic | text nullable | |
| dicairkan_by | FK users nullable | |
| catatan_pencairan | text nullable | |
| dicairkan_at | timestamp nullable | |
| rejected_at_step | string nullable | katim / kabag / ppk / pic |
| catatan_penolakan | text nullable | |
| created_by | FK users | PUMK yang membuat |
| timestamps | | created_at, updated_at |

### Tabel `permohonan_dana_item`

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | |
| permohonan_dana_id | FK (cascade delete) | |
| kode_akun | string(20) nullable | e.g. 521111, 524111 |
| uraian | string | Nama pekerjaan/barang/jasa |
| volume | decimal(10,2) | |
| satuan | string(50) | unit, OH, ls, buah, dll |
| harga_satuan | decimal(15,2) | |
| total | decimal(15,2) | Stored: volume × harga_satuan |
| keterangan | string nullable | |
| urutan | unsignedInteger | Urutan tampil |
| timestamps | | |

### Models

#### `App\Models\PermohonanDana`

```php
// Status helpers
isDraft()         isPicApproved()
isSubmitted()     isDicairkan()
isKatimApproved() isRejected()
isKabagApproved() isEditable()   // draft || rejected
isPpkApproved()

// Computed
getStatusLabelAttribute()  // → label bahasa Indonesia

// Relationships
tahunAnggaran()    katimApprovedBy()
timKerja()         kabagApprovedBy()
createdBy()        ppkApprovedBy()
items()            picApprovedBy()
                   dicairkanBy()
```

#### `App\Models\PermohonanDanaItem`

Fillable: `permohonan_dana_id`, `kode_akun`, `uraian`, `volume`, `satuan`, `harga_satuan`, `total`, `keterangan`, `urutan`

#### `App\Models\TimKerja`

Relasi baru: `pumk()` → hasOne User where role='pumk'

#### `App\Models\User`

Tambahan: `isPumk()`, `isPicKeuangan()`
Dihapus: `isKetuaKoordinator()` (tidak ada lagi konsep koordinator)

---

## 5. Controllers

### PUMK

**`Pumk\DashboardController`**
- Route: `GET /pumk/dashboard`
- Props: `user`, `tahun`, `total`, `draft`, `proses`, `rejected`, `dicairkan`, `totalDicairkan`

**`Pumk\PermohonanDanaController`**

| Method | Route | Keterangan |
|---|---|---|
| `index` | GET /pumk/permohonan-dana | List semua permohonan milik PUMK |
| `create` | GET /pumk/permohonan-dana/buat | Form buat baru |
| `store` | POST /pumk/permohonan-dana | Simpan, generate nomor, hitung total |
| `edit` | GET /pumk/permohonan-dana/{pd}/edit | Form edit (hanya status editable) |
| `update` | PUT /pumk/permohonan-dana/{pd} | Update + delete-insert ulang items |
| `destroy` | DELETE /pumk/permohonan-dana/{pd} | Hapus (hanya status editable) |
| `submit` | PATCH /pumk/permohonan-dana/{pd}/submit | draft/rejected → submitted |

Logika nomor: `PD/{tahun}/{str_pad($seq, 3, '0', STR_PAD_LEFT)}` — sequence global per `tahun_anggaran_id`

### KA.TIM

**`KetuaTim\PermohonanDanaController`**

| Method | Route | Keterangan |
|---|---|---|
| `index` | GET /ketua-tim/keuangan/permohonan-dana | List submitted milik tim sendiri |
| `approve` | POST .../approve | submitted → katim_approved |
| `reject` | POST .../reject | submitted → rejected (catatan wajib) |

Filter: `tim_kerja_id = auth()->user()->tim_kerja_id`

### Pimpinan (Kabag Umum & PPK)

**`Pimpinan\PermohonanDanaController`**

Satu controller untuk dua role — dibedakan via `statusForRole()` private helper:

| Role | Input status | Output status |
|---|---|---|
| kabag_umum | katim_approved | kabag_approved |
| ppk | kabag_approved | ppk_approved |

| Method | Route | Keterangan |
|---|---|---|
| `index` | GET /pimpinan/keuangan/permohonan-dana | List menunggu approval sesuai role |
| `approve` | POST .../approve | Maju ke status berikutnya |
| `reject` | POST .../reject | → rejected dengan rejected_at_step |

### PIC Keuangan

**`PicKeuangan\DashboardController`**
- Props: `menunggu_verifikasi` (ppk_approved count), `menunggu_pencairan` (pic_approved count), `selesai` (dicairkan count)

**`PicKeuangan\PermohonanDanaController`**

| Method | Route | Keterangan |
|---|---|---|
| `index` | GET /pic-keuangan/permohonan-dana | ppk_approved (menunggu) + riwayat pic sendiri |
| `approve` | POST .../approve | ppk_approved → pic_approved |
| `reject` | POST .../reject | → rejected, rejected_at_step = 'pic' |

### Bendahara

**`Bendahara\DashboardController`**
- Props: `siapCair` (count pic_approved), `sudahCair` (count dicairkan), `nilaiCair`, `nilaiSiap`, `riwayatCair` (5 terbaru)

**`Bendahara\PermohonanDanaController`**

| Method | Route | Keterangan |
|---|---|---|
| `index` | GET /bendahara/permohonan-dana | siapCair (pic_approved) + riwayat (dicairkan) |
| `cairkan` | POST .../cairkan | pic_approved → dicairkan, set dicairkan_at |

### Super Admin (Monitoring)

**`SuperAdmin\KeuanganController`**
- `permohonanDana()`: semua permohonan tahun aktif + filter tim
- Props: `tahun`, `permohonan` (all statuses), `timKerjaList`

---

## 6. Routes

### File Route

| File | Prefix | Middleware |
|---|---|---|
| `routes/roles/pumk.php` | pumk | auth, role:pumk |
| `routes/roles/ketua-tim.php` | ketua-tim | auth, role:ketua_tim_kerja |
| `routes/roles/pimpinan.php` | pimpinan | auth, role:pimpinan |
| `routes/roles/pic-keuangan.php` | pic-keuangan | auth, role:pic_keuangan |
| `routes/roles/bendahara.php` | bendahara | auth, role:bendahara |
| `routes/roles/super-admin.php` | super-admin | auth, role:super_admin |

### Named Routes

```
pumk.dashboard
pumk.permohonan-dana.index
pumk.permohonan-dana.create
pumk.permohonan-dana.store
pumk.permohonan-dana.edit
pumk.permohonan-dana.update
pumk.permohonan-dana.destroy
pumk.permohonan-dana.submit

ketua-tim.keuangan.permohonan-dana.index
ketua-tim.keuangan.permohonan-dana.approve
ketua-tim.keuangan.permohonan-dana.reject

pimpinan.keuangan.permohonan-dana.index
pimpinan.keuangan.permohonan-dana.approve
pimpinan.keuangan.permohonan-dana.reject

pic-keuangan.dashboard
pic-keuangan.permohonan-dana.index
pic-keuangan.permohonan-dana.approve
pic-keuangan.permohonan-dana.reject

bendahara.permohonan-dana.index
bendahara.permohonan-dana.cairkan
```

---

## 7. Frontend Pages

### PUMK

**`resources/js/pages/Pumk/Dashboard.tsx`**
- Stat cards: Total, Draft, Proses, Rejected, Dicairkan
- Link ke buat permohonan baru

**`resources/js/pages/Pumk/PermohonanDana/Index.tsx`**
- List permohonan milik PUMK yang login
- Expandable: tabel items lengkap
- Dialog submit (PATCH) + dialog delete (DELETE)
- Tampilkan `catatan_penolakan` jika status `rejected`
- Badge status berwarna

**`resources/js/pages/Pumk/PermohonanDana/Form.tsx`**
- Create & edit form (satu komponen, props `pd` nullable)
- Fields kegiatan: keperluan, tanggal_mulai, tanggal_selesai, tempat, no_sk, tgl_sk, no_st, tgl_st, keterangan
- Items dinamis: kode_akun, uraian, volume, satuan, harga_satuan, keterangan
- Real-time: subtotal per item + grand total computed di frontend
- Tombol tambah/hapus item

### PIC Keuangan

**`resources/js/pages/PicKeuangan/Dashboard.tsx`**
- 3 stat cards: Menunggu Verifikasi, Menunggu Pencairan, Selesai

**`resources/js/pages/PicKeuangan/PermohonanDana/Index.tsx`**
- Seksi "Menunggu Verifikasi" (ppk_approved)
- Seksi "Riwayat" (pic_approved & dicairkan yang di-handle PIC ini)
- AlertDialog approve/reject dengan Textarea catatan

### KA.TIM

**`resources/js/pages/KetuaTim/PermohonanDana/Approval.tsx`**
- List submitted milik tim sendiri
- Expandable: tabel items
- AlertDialog approve/reject + catatan

### Kabag Umum & PPK

**`resources/js/pages/Pimpinan/PermohonanDana/Index.tsx`**
- Role-aware labels: "Kabag Umum — Step 2" vs "PPK — Step 3"
- Tombol Setujui (hijau) / Tolak (merah)
- AlertDialog konfirmasi + Textarea catatan (wajib jika tolak)
- Expandable tabel items

### Bendahara

**`resources/js/pages/Bendahara/Dashboard.tsx`**
- 3 stat cards: Siap Dicairkan, Sudah Dicairkan, Total Nilai Dicairkan
- Riwayat 5 pencairan terakhir

**`resources/js/pages/Bendahara/PermohonanDana/Index.tsx`**
- Seksi "Siap Dicairkan" (pic_approved) — tombol "Cairkan Dana"
- Seksi "Riwayat Pencairan" (dicairkan) — list dengan tanggal cair
- AlertDialog konfirmasi cairkan + Textarea catatan opsional

### Super Admin

**`resources/js/pages/SuperAdmin/Keuangan/PermohonanDana/Index.tsx`**
- Summary: Total, Proses, Dicairkan (nilai), Ditolak
- Filter: search nomor/keperluan, filter status, filter tim
- Expandable tabel items per permohonan
- Read-only (tidak ada tombol action)

---

## 8. Navigasi per Role

| Role | File Config | Item Keuangan |
|---|---|---|
| `pumk` | `navigation/pumk.ts` | Dashboard `/pumk/dashboard`, Permohonan Dana `/pumk/permohonan-dana` |
| `ketua_tim_kerja` | `navigation/ketua-tim.ts` | Keuangan → Approval Permohonan `/ketua-tim/keuangan/permohonan-dana` |
| `pimpinan` | `navigation/pimpinan.ts` | Keuangan → Approval Permohonan `/pimpinan/keuangan/permohonan-dana` |
| `pic_keuangan` | `navigation/pic-keuangan.ts` | Dashboard `/pic-keuangan/dashboard`, Verifikasi Permohonan `/pic-keuangan/permohonan-dana` |
| `bendahara` | `navigation/bendahara.ts` | Permohonan Dana `/bendahara/permohonan-dana` |
| `super_admin` | `navigation/super-admin.ts` | Keuangan → Permohonan Dana `/super-admin/keuangan/permohonan-dana` |

`app-sidebar.tsx` membaca `auth.user.role` dari shared props Inertia dan memilih nav config yang sesuai via `navByRole` record.

### User Management (Super Admin)

`SuperAdmin/DataMaster/tabs/ManagementAccountTab.tsx`:
- Role dropdown includes: Super Admin, Ketua Tim Kerja, Pimpinan, Bendahara, **PUMK**, **PIC Keuangan**
- Tim Kerja selector tampil untuk `ketua_tim_kerja` DAN `pumk`
- `pimpinan` type selector: Kabag Umum / PPK

---

## 9. Fitur yang Belum Diimplementasi

Fitur-fitur berikut ada di SIPITUNG lama namun belum ada di implementasi baru:

### A. Histori Approval (Audit Trail)
- Di SIPITUNG: tabel `histori_ajuan` — log setiap perubahan status (siapa, kapan, catatan, role)
- Saat ini: hanya kolom per-step (`katim_approved_by`, `catatan_katim`, dst.) — tidak ada log urutan
- **Rencana:** Tambah tabel `permohonan_dana_histori` dan isi di setiap approve/reject/submit

### B. Upload Dokumen Pendukung
- Di SIPITUNG: tabel `dok_pendukung` — SK, ST, Bukti Bayar, LPJ, Dokumen lain
- Saat ini: field `no_sk`, `tgl_sk`, `no_st`, `tgl_st` ada, tapi file upload belum ada
- **Rencana:** Laravel Storage + tabel `permohonan_dana_dokumen`

### C. Export Excel
- Di SIPITUNG: rekap anggaran permohonan → `.xlsx` via PHPExcel
- Saat ini: tidak ada
- **Rencana:** `maatwebsite/excel` package

### D. Struktur Anggaran (TreeView/Hierarki)
- Di SIPITUNG: hierarki 8 level (Program → Sasaran → KRO → RO → Komponen → Kegiatan → Sub-Kegiatan → Rincian) sebagai master data anggaran
- PUMK memilih dari hierarki ini saat menambah item anggaran
- Saat ini: `kode_akun` diisi manual sebagai text bebas
- **Rencana (opsional):** Database hierarki + cascading dropdown di form PUMK

### E. TOR & RAB
- Di SIPITUNG: modul standalone untuk membuat KAK/TOR, export ke `.docx`
- Saat ini: tidak ada
- **Rencana (opsional):** Modul terpisah dengan PhpOffice/PhpWord

---

## 10. Perbandingan dengan SIPITUNG Lama

| Aspek | SIPITUNG Lama | Implementasi Baru |
|---|---|---|
| **Framework** | CodeIgniter 3 | Laravel 12 |
| **Frontend** | Bootstrap + jQuery + AJAX | React 19 + Inertia.js + shadcn/ui |
| **Auth** | Session manual, password plaintext | Fortify, bcrypt, username-based |
| **Role management** | Session `role` 0-8 | DB column `role` + middleware |
| **Approval steps** | 6 step (KA.TIM, KA.TIM KEU, Kabag, PPK, PIC, BP) | 5 step (KA.TIM, Kabag, PPK, PIC, Bendahara) |
| **KA.TIM KEU** | Role terpisah (role 8) | Dihapus — fungsinya diambil KA.TIM biasa |
| **Status workflow** | `status` + `perlu_aproval` dua kolom | `status` enum tunggal |
| **Rejection** | Status 'revisi' (PUMK edit + resubmit) | Status 'rejected' + `rejected_at_step` |
| **Item anggaran** | Dua tabel: reguler + pegawai/honor | Satu tabel `permohonan_dana_item` |
| **Hierarki anggaran** | Wajib pilih dari TreeView (8 level) | `kode_akun` text bebas (TreeView belum ada) |
| **Dokumen upload** | Ada (`dok_pendukung`) | Belum ada |
| **Histori approval** | Ada (`histori_ajuan`) | Belum ada (hanya kolom per-step) |
| **Export** | Excel + Word | Belum ada |
| **Nominatif pegawai** | Ada (ref_nama, PPh21 otomatis) | Belum ada |
| **TOR & RAB** | Modul tersendiri | Belum ada |
| **Nomor permohonan** | `XXX/UNIT/bulan-romawi/tahun` | `PD/{YYYY}/{seq_3digit}` |
