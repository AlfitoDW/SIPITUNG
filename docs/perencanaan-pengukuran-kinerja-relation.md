# Database Structure — Perencanaan & Pengukuran Kinerja
## Sistem Informasi LLDIKTI 3

---

## Diagram Relasi (ERD Ringkas)

```
tahun_anggaran
  ├──► perjanjian_kinerja ──► sasaran ──► indikator_kinerja ──► realisasi_kinerja
  │                                             │                       │
  │                                             ├──► indikator_kinerja_pic (pivot)
  │                                             │         └──► tim_kerja
  │                                             └── pic_tim_kerja_id ──► tim_kerja
  │
  ├──► rencana_aksi ──► rencana_aksi_indikator
  │         └── sasaran_id ──► sasaran (dari PK Awal)
  │
  ├──► master_sasaran
  │
  └──► periode_pengukuran ──► realisasi_kinerja
                         └──► laporan_pengukuran

tim_kerja ◄── users
```

---

## Tabel Master / Referensi

### `tim_kerja`
Unit kerja di LLDIKTI 3.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `nama` | varchar(255) | Nama lengkap |
| `nama_singkat` | varchar(255) nullable | Singkatan tampilan |
| `kode` | varchar(10) unique | Kode unik, contoh: `TK-HMK` |
| `deskripsi` | text nullable | |
| `is_active` | boolean default true | |
| `is_koordinator` | boolean default false | Tim Perencanaan & Keuangan — punya fungsi approval di modul Keuangan |
| `created_at` / `updated_at` | timestamp nullable | |

---

### `users`
Akun pengguna sistem.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `name` | varchar(255) | Nama lengkap |
| `email` | varchar(255) unique | |
| `password` | varchar(255) | |
| `role` | enum | `super_admin` / `ketua_tim_kerja` / `pimpinan` / `bendahara` |
| `pimpinan_type` | enum nullable | `kabag_umum` / `ppk` — hanya untuk role `pimpinan` |
| `tim_kerja_id` | bigint FK nullable | → `tim_kerja.id` ON DELETE SET NULL |
| `is_active` | boolean default true | Login diblokir jika false |
| `remember_token` | varchar(100) nullable | |
| `email_verified_at` | timestamp nullable | |
| `created_at` / `updated_at` | timestamp nullable | |

> Index: `role`, `is_active`

---

### `tahun_anggaran`
Tahun anggaran aktif — semua dokumen terikat ke satu tahun anggaran.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `tahun` | year unique | Contoh: `2026` |
| `label` | varchar(255) | Contoh: `TA 2026` |
| `is_active` | boolean default true | |
| `is_default` | boolean default false | Tahun yang ditampilkan saat user login |
| `created_at` / `updated_at` | timestamp nullable | |

---

### `master_sasaran`
Sasaran master per tahun anggaran — sumber tunggal daftar sasaran yang di-manage SuperAdmin. IKU di PK mengacu ke sasaran yang dibuat dari master ini.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `tahun_anggaran_id` | bigint FK | → `tahun_anggaran.id` CASCADE |
| `kode` | varchar(10) | Contoh: `S 1`, `S 2` |
| `nama` | varchar(255) | Nama sasaran strategis |
| `urutan` | tinyint unsigned default 1 | Urutan tampil |
| `created_at` / `updated_at` | timestamp nullable | |

> Unique: `(tahun_anggaran_id, kode)`

---

## Tabel Modul Perencanaan

### `perjanjian_kinerja`
Dokumen Perjanjian Kinerja (PK) per tim kerja per tahun. Bisa punya dua jenis: `awal` dan `revisi`.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `tahun_anggaran_id` | bigint FK | → `tahun_anggaran.id` CASCADE |
| `tim_kerja_id` | bigint FK | → `tim_kerja.id` CASCADE |
| `jenis` | enum | `awal` / `revisi` |
| `status` | enum default `draft` | `draft` / `submitted` / `kabag_approved` / `ppk_approved` / `rejected` |
| `rekomendasi_kabag` | text nullable | Catatan dari Kabag Umum saat approve/reject |
| `rekomendasi_ppk` | text nullable | (Legacy — PPK tidak approve via UI) |
| `rejected_by` | varchar(255) nullable | `kabag_umum` / `ppk` |
| `created_by` | bigint FK | → `users.id` |
| `created_at` / `updated_at` | timestamp nullable | |

> Unique: `(tahun_anggaran_id, tim_kerja_id, jenis)`
>
> Status aktif di UI: `draft → submitted → kabag_approved (TERKUNCI) | rejected`. Kolom `ppk_approved` dan `rekomendasi_ppk` ada di ENUM/schema tapi tidak digunakan dalam alur approval saat ini.

---

### `sasaran`
Sasaran strategis dalam satu PK. Dibuat dari `master_sasaran` saat SuperAdmin menambah IKU pertama kali ke PK.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `perjanjian_kinerja_id` | bigint FK | → `perjanjian_kinerja.id` CASCADE |
| `kode` | varchar(20) | Contoh: `S 1`, `S 2` |
| `nama` | text | Nama sasaran |
| `urutan` | smallint unsigned default 0 | Urutan tampil |
| `created_at` / `updated_at` | timestamp nullable | |

---

### `indikator_kinerja`
Indikator Kinerja Utama (IKU) dalam satu sasaran PK.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `sasaran_id` | bigint FK | → `sasaran.id` CASCADE |
| `kode` | varchar(20) | Contoh: `IKU 1.1`, `IKU 2.3` |
| `nama` | text | Nama indikator |
| `satuan` | varchar(50) | Contoh: `%`, `dokumen`, `orang` |
| `target` | varchar(50) | Target tahunan (diisi KetuaTim) |
| `target_tw1` | varchar(50) nullable | Target Triwulan I |
| `target_tw2` | varchar(50) nullable | Target Triwulan II |
| `target_tw3` | varchar(50) nullable | Target Triwulan III |
| `target_tw4` | varchar(50) nullable | Target Triwulan IV |
| `urutan` | smallint unsigned default 0 | Urutan tampil |
| `pic_tim_kerja_id` | bigint FK nullable | → `tim_kerja.id` ON DELETE SET NULL — Primary PIC (backward-compat) |
| `created_at` / `updated_at` | timestamp nullable | |

---

### `indikator_kinerja_pic` *(pivot)*
Many-to-many antara `indikator_kinerja` dan `tim_kerja`. Menyimpan semua PIC (primary + co-PIC).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `indikator_kinerja_id` | bigint unsigned FK | → `indikator_kinerja.id` CASCADE |
| `tim_kerja_id` | bigint unsigned FK | → `tim_kerja.id` CASCADE |
| `created_at` / `updated_at` | timestamp nullable | |

> Unique: `(indikator_kinerja_id, tim_kerja_id)`
>
> FK menggunakan nama custom untuk menghindari konflik naming MySQL.

---

### `rencana_aksi`
Dokumen Rencana Aksi (RA) per tim kerja per tahun. Satu tim kerja hanya punya satu RA per tahun.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `tahun_anggaran_id` | bigint FK | → `tahun_anggaran.id` CASCADE |
| `tim_kerja_id` | bigint FK | → `tim_kerja.id` CASCADE |
| `peer_tim_kerja_id` | bigint FK nullable | → `tim_kerja.id` ON DELETE SET NULL — Co-PIC tim lain yang terlibat di RA ini |
| `status` | enum default `draft` | `draft` / `submitted` / `kabag_approved` / `ppk_approved` / `rejected` |
| `rekomendasi_kabag` | text nullable | Catatan Kabag Umum |
| `rekomendasi_ppk` | text nullable | (Legacy) |
| `rejected_by` | varchar(255) nullable | `kabag_umum` |
| `created_by` | bigint FK | → `users.id` |
| `created_at` / `updated_at` | timestamp nullable | |

> Unique: `(tahun_anggaran_id, tim_kerja_id, peer_tim_kerja_id)`

---

### `rencana_aksi_indikator`
Baris IKU dalam satu Rencana Aksi. Mengacu ke sasaran dari PK Awal.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `rencana_aksi_id` | bigint FK | → `rencana_aksi.id` CASCADE |
| `sasaran_id` | bigint FK nullable | → `sasaran.id` ON DELETE SET NULL — sasaran dari PK Awal tim kerja yang sama |
| `kode` | varchar(20) | Menyalin kode dari IKU PK Awal |
| `nama` | text | |
| `satuan` | varchar(50) | |
| `target` | varchar(50) | Target tahunan |
| `target_tw1` | varchar(50) nullable | |
| `target_tw2` | varchar(50) nullable | |
| `target_tw3` | varchar(50) nullable | |
| `target_tw4` | varchar(50) nullable | |
| `urutan` | smallint unsigned default 0 | |
| `created_at` / `updated_at` | timestamp nullable | |

---

## Tabel Modul Pengukuran Kinerja

### `periode_pengukuran`
Periode triwulan yang dibuat dan diaktifkan oleh SuperAdmin. Hanya satu periode yang boleh aktif sekaligus.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `tahun_anggaran_id` | bigint FK | → `tahun_anggaran.id` CASCADE |
| `triwulan` | enum | `TW1` / `TW2` / `TW3` / `TW4` |
| `tanggal_mulai` | date nullable | |
| `tanggal_selesai` | date nullable | |
| `is_active` | boolean default false | Toggle dikelola SuperAdmin |
| `rekomendasi_pimpinan` | text nullable | Catatan rekomendasi dari Pimpinan untuk periode ini |
| `created_at` / `updated_at` | timestamp nullable | |

> Unique: `(tahun_anggaran_id, triwulan)`

---

### `realisasi_kinerja`
Nilai realisasi aktual per IKU per periode. Satu baris per IKU per periode — siapa yang pertama mengisi, dia yang mengunci.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `indikator_kinerja_id` | bigint FK | → `indikator_kinerja.id` CASCADE |
| `periode_pengukuran_id` | bigint FK | → `periode_pengukuran.id` CASCADE |
| `input_by_tim_kerja_id` | bigint FK nullable | → `tim_kerja.id` ON DELETE SET NULL — siapa yang mengisi duluan |
| `realisasi` | varchar(100) nullable | Nilai capaian |
| `progress_kegiatan` | text nullable | Narasi progres |
| `kendala` | text nullable | Kendala yang dihadapi |
| `strategi_tindak_lanjut` | text nullable | Rencana tindak lanjut |
| `catatan` | text nullable | Catatan koordinasi (muncul jika IKU punya co-PIC) |
| `created_by` | bigint FK | → `users.id` |
| `created_at` / `updated_at` | timestamp nullable | |

> Unique: `(indikator_kinerja_id, periode_pengukuran_id)` — memastikan hanya satu nilai resmi per IKU per periode.

---

### `laporan_pengukuran`
Laporan pengukuran kinerja yang di-submit oleh KetuaTim per periode. Diproses/approve oleh Kabag Umum.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `tim_kerja_id` | bigint FK | → `tim_kerja.id` CASCADE |
| `periode_pengukuran_id` | bigint FK | → `periode_pengukuran.id` CASCADE |
| `peer_tim_kerja_id` | bigint FK nullable | → `tim_kerja.id` ON DELETE SET NULL — Co-PIC tim lain dalam laporan ini |
| `status` | enum default `draft` | `draft` / `submitted` / `kabag_approved` / `rejected` |
| `submitted_at` | timestamp nullable | Waktu submit |
| `submitted_by` | bigint FK nullable | → `users.id` ON DELETE SET NULL |
| `rekomendasi_kabag` | text nullable | Catatan Kabag Umum saat approve/reject |
| `approved_at` | timestamp nullable | Waktu approval Kabag |
| `approved_by` | bigint FK nullable | → `users.id` ON DELETE SET NULL |
| `created_by` | bigint FK nullable | → `users.id` ON DELETE SET NULL |
| `created_at` / `updated_at` | timestamp nullable | |

> Unique: `(tim_kerja_id, periode_pengukuran_id, peer_tim_kerja_id)`

---

## Ringkasan Relasi Antar Tabel

| Dari | Ke | Tipe | Via |
|---|---|---|---|
| `users` | `tim_kerja` | many-to-one | `users.tim_kerja_id` |
| `perjanjian_kinerja` | `tahun_anggaran` | many-to-one | `perjanjian_kinerja.tahun_anggaran_id` |
| `perjanjian_kinerja` | `tim_kerja` | many-to-one | `perjanjian_kinerja.tim_kerja_id` |
| `sasaran` | `perjanjian_kinerja` | many-to-one | `sasaran.perjanjian_kinerja_id` |
| `indikator_kinerja` | `sasaran` | many-to-one | `indikator_kinerja.sasaran_id` |
| `indikator_kinerja` | `tim_kerja` | many-to-many | `indikator_kinerja_pic` (pivot) |
| `indikator_kinerja` | `tim_kerja` | many-to-one | `indikator_kinerja.pic_tim_kerja_id` (primary PIC, backward-compat) |
| `master_sasaran` | `tahun_anggaran` | many-to-one | `master_sasaran.tahun_anggaran_id` |
| `rencana_aksi` | `tahun_anggaran` | many-to-one | `rencana_aksi.tahun_anggaran_id` |
| `rencana_aksi` | `tim_kerja` | many-to-one | `rencana_aksi.tim_kerja_id` |
| `rencana_aksi` | `tim_kerja` | many-to-one | `rencana_aksi.peer_tim_kerja_id` (co-PIC) |
| `rencana_aksi_indikator` | `rencana_aksi` | many-to-one | `rencana_aksi_indikator.rencana_aksi_id` |
| `rencana_aksi_indikator` | `sasaran` | many-to-one | `rencana_aksi_indikator.sasaran_id` (dari PK Awal) |
| `periode_pengukuran` | `tahun_anggaran` | many-to-one | `periode_pengukuran.tahun_anggaran_id` |
| `realisasi_kinerja` | `indikator_kinerja` | many-to-one | `realisasi_kinerja.indikator_kinerja_id` |
| `realisasi_kinerja` | `periode_pengukuran` | many-to-one | `realisasi_kinerja.periode_pengukuran_id` |
| `realisasi_kinerja` | `tim_kerja` | many-to-one | `realisasi_kinerja.input_by_tim_kerja_id` |
| `laporan_pengukuran` | `tim_kerja` | many-to-one | `laporan_pengukuran.tim_kerja_id` |
| `laporan_pengukuran` | `periode_pengukuran` | many-to-one | `laporan_pengukuran.periode_pengukuran_id` |
| `laporan_pengukuran` | `tim_kerja` | many-to-one | `laporan_pengukuran.peer_tim_kerja_id` (co-PIC) |

---

## Catatan Desain Penting

1. **`sasaran` bukan tabel global** — setiap PK punya sasaran sendiri, dibuat ulang dari `master_sasaran` saat SuperAdmin tambah IKU. `rencana_aksi_indikator.sasaran_id` FK ke sasaran milik PK Awal tim kerja yang sama.

2. **Dua mekanisme PIC di `indikator_kinerja`**:
   - `pic_tim_kerja_id` — kolom legacy untuk primary PIC, dipertahankan untuk backward-compat
   - Pivot `indikator_kinerja_pic` — sumber kebenaran multi-PIC; semua PIC (primary + co-PIC) ada di sini

3. **`realisasi_kinerja` unique per IKU per periode** — unique constraint `(indikator_kinerja_id, periode_pengukuran_id)` memastikan hanya ada satu nilai resmi. Siapa yang pertama `store`, dialah yang mengunci pengisian untuk PIC lain.

4. **`laporan_pengukuran` dan `rencana_aksi` punya `peer_tim_kerja_id`** — untuk tim yang menjadi co-PIC di IKU bersama, laporan dibuat dengan `peer_tim_kerja_id` untuk membedakan laporan "sebagai primary" vs "sebagai co-PIC".

5. **Status `ppk_approved` masih ada di ENUM** `perjanjian_kinerja` dan `rencana_aksi` — ini sisa dari desain lama. Dalam alur UI saat ini, status final adalah `kabag_approved`. Kolom `rekomendasi_ppk` juga tidak diisi.

---

*Dokumen ini berdasarkan state migrasi per 2026-04-14.*
