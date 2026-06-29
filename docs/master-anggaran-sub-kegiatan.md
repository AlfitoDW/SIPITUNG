# Master Anggaran: Sub Kegiatan

Dokumen ini mencatat perubahan struktur Master Anggaran DJA pada modul keuangan.

## Ringkasan

Struktur lama:

```text
Program -> Sasaran -> KRO -> RO -> Komponen -> Kegiatan -> Rincian Biaya
```

Struktur baru:

```text
Program -> Sasaran -> KRO -> RO -> Komponen -> Kegiatan -> Sub Kegiatan -> Rincian Biaya
```

`Sub Kegiatan` merepresentasikan akun anggaran yang sebelumnya disimpan berulang di setiap rincian biaya:

```text
kode_akun + nama_akun
```

Contoh:

```text
Kegiatan A
  Sub Kegiatan: 521213 - Belanja Honor Output Kegiatan
    Rincian Biaya: Honorarium Narasumber
    Rincian Biaya: Honorarium Moderator

  Sub Kegiatan: 524113 - Belanja Perjalanan Dinas Dalam Kota
    Rincian Biaya: Transport Peserta
    Rincian Biaya: Uang Harian Peserta
```

## Alasan Perubahan

Pada struktur lama, `kode_akun` dan `nama_akun` berada langsung di `dja_rincian_biaya`. Ini menimbulkan beberapa masalah:

- `kode_akun` dan `nama_akun` berulang di banyak rincian biaya.
- Typo pada `nama_akun` bisa memecah grouping akun yang seharusnya sama.
- Master data tidak punya parent eksplisit untuk akun/sub kegiatan.
- Wizard permohonan dana hanya bisa grouping berdasarkan string `kode_akun|nama_akun`.

Struktur baru membuat akun menjadi entitas parent yang eksplisit melalui `dja_sub_kegiatan`.

## Skema Data Baru

Tabel baru:

```text
dja_sub_kegiatan
- id
- kegiatan_id
- kode_akun
- nama_akun
- pagu
- urutan
- is_aktif
- created_at
- updated_at
```

Target akhir `dja_rincian_biaya`:

```text
dja_rincian_biaya
- id
- sub_kegiatan_id
- nama_item
- volume_default
- satuan
- harga_satuan
- pagu_total
- urutan
- is_aktif
- overbudget_flag
- created_at
- updated_at
```

Kolom lama yang dipindahkan dari `dja_rincian_biaya`:

```text
kegiatan_id
kode_akun
nama_akun
```

## Backfill Data Existing

Migration melakukan backfill dengan rule:

```text
group by kegiatan_id + kode_akun + nama_akun
```

Setiap group menjadi satu record `dja_sub_kegiatan`.

Semua `dja_rincian_biaya` existing lalu dihubungkan ke `dja_sub_kegiatan` melalui `sub_kegiatan_id`.

Setelah backfill lokal:

```text
sub_kegiatan: 210
rincian_biaya: 702
rincian_missing_parent: 0
```

## Import DJA

Parser import Excel sekarang memperlakukan baris akun 6 digit sebagai `Sub Kegiatan`.

Sebelum:

```text
Baris akun hanya menjadi state sementara untuk rincian biaya berikutnya.
```

Sesudah:

```text
Baris akun menjadi node sub_kegiatan.
Rincian biaya berikutnya menjadi child dari sub_kegiatan tersebut.
```

Path import lama:

```text
.../kegiatan:A/rincian_biaya:521213:Honorarium Narasumber
```

Path import baru:

```text
.../kegiatan:A/sub_kegiatan:521213/rincian_biaya:Honorarium Narasumber
```

Jika baris akun tidak punya nilai pagu, sistem mengisi `dja_sub_kegiatan.pagu` dari subtotal `pagu_total` rincian biaya di bawahnya.

## Master Anggaran UI

Tab Master Anggaran sekarang menjadi:

```text
Program
Sasaran
KRO
RO
Komponen
Kegiatan
Sub Kegiatan
Rincian Biaya
```

Tab `Sub Kegiatan` mengelola:

```text
Parent Kegiatan
Kode Akun
Nama Akun
Pagu
Status Aktif
```

Tab `Rincian Biaya` sekarang memilih parent `Sub Kegiatan`, bukan `Kegiatan`.

## Wizard Permohonan Dana

Header permohonan dana tetap memilih sampai level `Kegiatan`.

Pemilihan rincian biaya di Step 4 sekarang mengambil data melalui:

```text
DjaKegiatan -> DjaSubKegiatan -> DjaRincianBiaya
```

Tampilan Step 4 dikelompokkan berdasarkan `Sub Kegiatan`:

```text
521213 - Belanja Honor Output Kegiatan
  Honorarium Narasumber
  Honorarium Moderator

524113 - Belanja Perjalanan Dinas Dalam Kota
  Transport Peserta
  Uang Harian Peserta
```

Validasi pagu tetap berada di level `Rincian Biaya`, karena `PermohonanDanaItem` tetap menunjuk ke `dja_rincian_biaya_id`.

## Snapshot Kode Akun

`PermohonanDanaItem.kode_akun` tetap dipertahankan sebagai snapshot.

Alasannya:

- Dipakai untuk menentukan tipe nominatif: honor, perjadin, non-nominatif.
- Dipakai untuk validasi nominatif wajib.
- Dipakai oleh detail internal dan export nominatif.
- Melindungi dokumen/permohonan existing dari perubahan master data setelah diajukan.

Saat item permohonan dibuat, `kode_akun` diambil dari:

```text
DjaRincianBiaya -> DjaSubKegiatan -> kode_akun
```

## Delete Dan Toggle

Aturan delete mengikuti pola existing:

- `Sub Kegiatan` tidak bisa dihapus jika ada rincian biaya di bawahnya yang sudah dipakai permohonan dana aktif.
- Jika belum dipakai permohonan aktif, delete sub kegiatan akan menghapus rincian turunannya melalui cascade.
- Toggle aktif/nonaktif hanya mengubah `dja_sub_kegiatan.is_aktif`.

Query pemilihan rincian baru harus filter:

```text
sub_kegiatan.is_aktif = true
rincian_biaya.is_aktif = true
```

## Area Kode Utama

Backend:

```text
app/Models/DjaSubKegiatan.php
app/Models/DjaKegiatan.php
app/Models/DjaRincianBiaya.php
app/Http/Controllers/SuperAdmin/DjaController.php
app/Http/Controllers/Pumk/PermohonanDanaController.php
app/Http/Controllers/Pumk/NominatifController.php
app/Services/DjaImportService.php
app/Console/Commands/ImportDjaCommand.php
```

Frontend:

```text
resources/js/pages/SuperAdmin/Keuangan/MasterAnggaran/Index.tsx
resources/js/pages/Pumk/PermohonanDana/Wizard.tsx
```

Database:

```text
database/migrations/2026_06_29_100001_create_dja_sub_kegiatan_table.php
```

Tests/factories:

```text
database/factories/DjaSubKegiatanFactory.php
database/factories/DjaRincianBiayaFactory.php
tests/Feature/Keuangan/PermohonanDanaPaguTest.php
tests/Feature/Keuangan/PermohonanDanaRincianBiayaTest.php
tests/Feature/Keuangan/DjaHierarchyDeleteGuardTest.php
```

## Verifikasi Yang Sudah Dilakukan

Berhasil:

```bash
php artisan migrate
php artisan test --filter=PermohonanDanaRincianBiayaTest
php artisan test --filter=PermohonanDanaPaguTest
php artisan test --filter=DjaHierarchyDeleteGuardTest
npm run build
```

Catatan:

- `npm run types` masih gagal karena error TypeScript existing di luar perubahan ini.
- Full `php artisan test` masih gagal pada test auth/settings existing karena `users.username` wajib tapi fixture default Laravel tidak mengisi `username`.
- Semua test keuangan/DJA yang terdampak perubahan ini sudah lolos.

## Catatan Scope

Perubahan ini tidak melakukan redesign format export permohonan dana.

Export/print resmi tetap mengikuti format existing. Jika membutuhkan `kode_akun`, sumber paling aman adalah snapshot:

```text
PermohonanDanaItem.kode_akun
```
