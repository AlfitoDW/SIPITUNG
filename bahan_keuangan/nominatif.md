# Prompt Claude Code — Implementasi Rincian Biaya + Daftar Nominatif (PUMK)

## KONTEKS APLIKASI

Stack: **Laravel 12 + React 19 + Inertia.js + shadcn/ui (New York) + Tailwind CSS 4**
Auth: Fortify, login by username
Bridge: Inertia.js — bukan REST API, semua data via controller props
ORM: Eloquent

### Modul Keuangan yang Sudah Ada

Struktur yang sudah berjalan:
- `permohonan_dana` — header permohonan (id, tim_kerja_id, nomor_permohonan, keperluan, tanggal_mulai, tanggal_selesai, tempat, no_sk, tgl_sk, no_st, tgl_st, total_anggaran, status, created_by, dll)
- `permohonan_dana_item` — rincian biaya bebas (id, permohonan_dana_id, kode_akun, uraian, volume, satuan, harga_satuan, total, keterangan, urutan)
- Routes: `pumk.permohonan-dana.*` prefix `/pumk/permohonan-dana`
- Controller: `Pumk\PermohonanDanaController`
- Page: `resources/js/pages/Pumk/PermohonanDana/Form.tsx` (form PUMK dengan items dinamis)

### Alur Status yang Sudah Ada

```
draft → submitted → katim_approved → kabag_approved → ppk_approved → pic_approved → dicairkan
                                                                                   (atau rejected di mana saja)
```

---

## FITUR YANG HARUS DIBANGUN

### TUJUAN UTAMA

Saat PUMK mengisi **Rincian Biaya** (permohonan_dana_item), untuk item yang bersifat **honor/perjalanan dinas per orang**, PUMK harus bisa input **nama peserta beserta detail per baris**. Data ini kemudian menjadi **Daftar Nominatif** yang bisa di-export ke Excel oleh Bendahara setelah dana dicairkan.

---

## BAGIAN 1 — DATABASE

### 1.1 Tabel `ref_pegawai` (Master Data Pegawai)

Tabel ini adalah sumber nama peserta yang bisa dipilih PUMK saat input nominatif.

```sql
ref_pegawai:
  id              bigint PK auto_increment
  nama            varchar(100) NOT NULL
  nip             varchar(30) nullable       -- NIP ASN
  nik             varchar(20) nullable       -- NIK KTP
  npwp            varchar(25) nullable       -- NPWP
  gol_ruang       varchar(10) nullable       -- Gol/Ruang ASN, contoh: III/a
  nama_rekening   varchar(100) nullable      -- Nama di rekening bank
  norek           varchar(30) nullable       -- Nomor rekening
  nama_bank       varchar(50) nullable       -- BNI, BCA, Mandiri, dll
  email           varchar(100) nullable
  pph21           decimal(5,2) default 0    -- Tarif PPh21 dalam persen, contoh: 5.00 = 5%
  is_aktif        boolean default true
  timestamps
```

### 1.2 Tabel `permohonan_dana_item_nominatif`

Tabel ini menyimpan data per orang per item rincian biaya.

```sql
permohonan_dana_item_nominatif:
  id                      bigint PK auto_increment
  permohonan_dana_item_id bigint FK → permohonan_dana_item (cascade delete) NOT NULL
  permohonan_dana_id      bigint FK → permohonan_dana (cascade delete) NOT NULL
  ref_pegawai_id          bigint FK → ref_pegawai nullable   -- null = input manual
  -- Data pegawai (snapshot saat input, bisa berbeda dari ref_pegawai jika diedit)
  nama                    varchar(100) NOT NULL
  nip                     varchar(30) nullable
  nik                     varchar(20) nullable
  npwp                    varchar(25) nullable
  gol_ruang               varchar(10) nullable
  nama_rekening           varchar(100) nullable
  norek                   varchar(30) nullable
  nama_bank               varchar(50) nullable
  email                   varchar(100) nullable
  pph21                   decimal(5,2) default 0
  -- Untuk tipe HONOR (521115, 521213, 522151)
  jabatan                 varchar(100) nullable   -- Ketua/Anggota/Narasumber/Moderator/Sekretaris/PJ
  volume                  decimal(10,2) default 1
  harga_satuan            decimal(15,2) default 0
  jumlah_bruto            decimal(15,2) generated always as (volume * harga_satuan) stored
  jumlah_pajak            decimal(15,2) default 0    -- dihitung: jumlah_bruto * (pph21/100)
  jumlah_diterima         decimal(15,2) default 0    -- jumlah_bruto - jumlah_pajak
  -- Untuk tipe PERJALANAN DINAS (524111, 524119, 524113)
  transport               decimal(15,2) default 0    -- uang transport
  uang_harian_vol         decimal(10,2) default 0    -- volume hari uang harian biasa
  uang_harian_satuan      decimal(15,2) default 0    -- satuan uang harian biasa
  uang_harian_jumlah      decimal(15,2) default 0    -- vol x satuan
  fullboard_vol           decimal(10,2) default 0
  fullboard_satuan        decimal(15,2) default 0
  fullboard_jumlah        decimal(15,2) default 0
  fullday_vol             decimal(10,2) default 0
  fullday_satuan          decimal(15,2) default 0
  fullday_jumlah          decimal(15,2) default 0
  representasi            decimal(15,2) default 0
  taksi_pp                decimal(15,2) default 0
  tiket_pesawat           decimal(15,2) default 0
  hotel                   decimal(15,2) default 0
  jumlah_perjadin         decimal(15,2) default 0    -- total semua komponen perjadin
  -- Meta
  urutan                  unsignedInteger default 0
  timestamps
```

### 1.3 Kolom Tambahan di `permohonan_dana`

Tambahkan kolom ini via migration baru (alter table):

```sql
tgl_nominatif   date nullable    -- tanggal ditetapkan nominatif (diisi bendahara saat cairkan)
```

### 1.4 Kolom Tambahan di `permohonan_dana_item`

```sql
tipe_nominatif  enum('honor', 'perjadin', 'non_nominatif') default 'non_nominatif'
-- honor      → item yang butuh data per orang (kode_akun 521115, 521213, 522151)
-- perjadin   → perjalanan dinas per orang (524111, 524119, 524113)
-- non_nominatif → item biasa tanpa per-orang
```

---

## BAGIAN 2 — LOGIKA BISNIS KODE AKUN

Ini adalah aturan dari aplikasi lama yang harus direplikasi persis:

### Mapping Kode Akun → Tipe Nominatif

| Kode Akun | Nama Akun | Tipe | Format Excel |
|---|---|---|---|
| `521115` | Honorarium Operasional Satuan Kerja | `honor` | Format A (tanpa kolom Jabatan) |
| `521213` | Belanja Honor Output Kegiatan (Panitia) | `honor` | Format B (dengan kolom Jabatan) |
| `522151` | Belanja Jasa Profesi (Narasumber) | `honor` | Format B (dengan kolom Jabatan) |
| `524111` | Belanja Perjalanan Dinas Biasa (Luar Kota) | `perjadin` | Format C (kolom transport, harian, hotel, dll) |
| `524119` | Belanja Perjalanan Dinas Paket Meeting (Luar Kota) | `perjadin` | Format C |
| `524113` | Belanja Perjalanan Dinas Dalam Kota | `perjadin` | Format C |
| Kode lain | - | `non_nominatif` | Tidak ada nominatif |

**Rule:** Saat PUMK memilih `kode_akun` di form item, sistem otomatis set `tipe_nominatif`.

---

## BAGIAN 3 — BACKEND (LARAVEL)

### 3.1 Model Baru

**`App\Models\RefPegawai`**
```php
protected $fillable = ['nama','nip','nik','npwp','gol_ruang','nama_rekening','norek','nama_bank','email','pph21','is_aktif'];
scope: scopeAktif($query) → where is_aktif = true
```

**`App\Models\PermohonanDanaItemNominatif`**
```php
protected $fillable = [
  'permohonan_dana_item_id','permohonan_dana_id','ref_pegawai_id',
  'nama','nip','nik','npwp','gol_ruang','nama_rekening','norek','nama_bank','email','pph21',
  'jabatan','volume','harga_satuan','jumlah_pajak','jumlah_diterima',
  'transport','uang_harian_vol','uang_harian_satuan','uang_harian_jumlah',
  'fullboard_vol','fullboard_satuan','fullboard_jumlah',
  'fullday_vol','fullday_satuan','fullday_jumlah',
  'representasi','taksi_pp','tiket_pesawat','hotel','jumlah_perjadin','urutan'
];

// Relationships
public function item() → belongsTo(PermohonanDanaItem::class, 'permohonan_dana_item_id')
public function pegawai() → belongsTo(RefPegawai::class, 'ref_pegawai_id')
```

**Tambahan di `PermohonanDanaItem`:**
```php
public function nominatif() → hasMany(PermohonanDanaItemNominatif::class)

public function isHonor(): bool {
  return in_array($this->kode_akun, ['521115', '521213', '522151']);
}
public function isPerjadin(): bool {
  return in_array($this->kode_akun, ['524111', '524119', '524113']);
}
```

**Tambahan di `PermohonanDana`:**
```php
public function nominatifPeserta() → hasManyThrough(PermohonanDanaItemNominatif::class, PermohonanDanaItem::class)
```

### 3.2 Controller Nominatif PUMK

Buat `Pumk\NominatifController`:

```
GET  /pumk/permohonan-dana/{pd}/nominatif          → index (form input nominatif per item)
POST /pumk/permohonan-dana/{pd}/nominatif/simpan   → store (simpan semua nominatif)
GET  /pumk/ref-pegawai/search                      → searchPegawai (AJAX autocomplete)
```

**`index(PermohonanDana $pd)`:**
- Guard: `$pd->created_by == auth()->id()` dan `$pd->isEditable()` (draft atau rejected)
- Props ke Inertia:
  - `permohonan` → $pd dengan relasi items.nominatif, items diurutkan urutan
  - `items_honor` → $pd->items->filter(fn($i) => $i->isHonor())
  - `items_perjadin` → $pd->items->filter(fn($i) => $i->isPerjadin())
  - `ref_pegawai` → RefPegawai::aktif()->orderBy('nama')->get(['id','nama','nip','nik','npwp','gol_ruang','nama_rekening','norek','nama_bank','email','pph21'])

**`store(Request $request, PermohonanDana $pd)`:**
- Validasi: `nominatif` array of objects per item_id
- Delete existing: `PermohonanDanaItemNominatif::where('permohonan_dana_id', $pd->id)->delete()`
- Insert baru dari request
- Hitung `jumlah_pajak = jumlah_bruto * (pph21/100)`, `jumlah_diterima = jumlah_bruto - jumlah_pajak`
- Untuk perjadin: `jumlah_perjadin = transport + uang_harian_jumlah + fullboard_jumlah + fullday_jumlah + representasi + taksi_pp + tiket_pesawat + hotel`
- Redirect kembali dengan flash success

**`searchPegawai(Request $request)`:**
- `q` = query string
- Return JSON: RefPegawai::aktif()->where('nama', 'LIKE', "%{$q}%")->limit(20)->get(...)

### 3.3 Controller Export Excel Bendahara

Buat `Bendahara\NominatifExportController`:

```
GET /bendahara/permohonan-dana/{pd}/export-nominatif → export
```

**Gunakan package `maatwebsite/excel`.**

Logic export (replikasi dari SIPITUNG lama):
- Sheet per kode akun yang ada di item permohonan
- Sheet name = kode akun (contoh: `521213`)
- Tab color:
  - Honor (521xxx, 522xxx) → `F4B084` (orange)
  - Perjadin (524xxx) → `00B0F0` (biru)

**Format Sheet Honor `521115` (Format A — tanpa Jabatan):**

Header row 9-11:
```
No | Nama | NIK | NPWP | Gol | Honorarium [Jml Keg | Rp/Jam | Jml Bruto] | DPP [PNS/Non PNS] | PPH21 [Tarif | Jml Pajak] | Jumlah Diterima | Atas Nama Rekening | Nomor Rekening | Bank | Email
```
Kolom: A-P (16 kolom)

**Format Sheet Honor `521213`/`522151` (Format B — dengan Jabatan):**

Header row 11-13:
```
No | Nama | Jabatan Dalam Tugas | NIK | NPWP | Gol | Honorarium [Jml Keg | Rp/Jam | Jml Bruto] | DPP [PNS/Non PNS] | PPH21 [Tarif | Jml Pajak] | Jumlah Diterima | Atas Nama Rekening | Nomor Rekening | Bank | Email
```
Kolom: A-Q (17 kolom)

Judul sheet:
- `521213` → "DAFTAR PEMBAYARAN HONORARIUM PANITIA"
- `522151` → "DAFTAR PEMBAYARAN HONORARIUM NARASUMBER DAN MODERATOR"

**Format Sheet Perjalanan Dinas `524111`/`524119`/`524113` (Format C):**

Header row 11-13:
```
No | Nama | Transport (Rp) | Uang Harian Biasa [Jml Hari | Satuan | Jumlah] | Uang Harian Fullboard [Jml Hari | Satuan | Jumlah] | Uang Harian Fullday [Jml Hari | Satuan | Jumlah] | Uang Representasi | Taksi PP | Tiket Pesawat | Akomodasi Hotel | Jumlah Diterima (Rp) | Atas Nama Rekening | Nomor Rekening | Bank | Email
```
Kolom: A-U (21 kolom)

**Header umum semua sheet (baris 1-9):**
```
Baris 1: "Lampiran :"
Baris 2: "Surat Keputusan Kepala LLDIKTI Wilayah III selaku KPA"
Baris 3: "Nomor : {no_sk} Tanggal {tgl_sk}" (untuk honor) atau "Nomor : {no_st} Tanggal {tgl_st}" (untuk perjadin)
Baris 5: "DAFTAR PEMBAYARAN {JUDUL}"
Baris 6: "KEGIATAN {keperluan_uppercase}"
Baris 7: "DI LINGKUNGAN LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III JAKARTA TAHUN ANGGARAN {tahun}"
Baris 8: "DI {tempat_uppercase} TANGGAL {tgl_pelaksanaan_uppercase}"
Baris 9: "{kode_akun} {nama_item}"
```

**Footer semua sheet (setelah baris data):**
```
Baris Jumlah: "Jumlah" + total kolom numerik
Baris Terbilang: "Terbilang : {terbilang(jumlah_diterima)} Rupiah"
+4: Keterangan PPh21
+5: Keterangan PMK
+7: "Jakarta, {tgl_nominatif}"
+8: "Mengetahui/Menyetujui" | "Lunas dibayar tanggal:"
+9: "an. Kuasa Pengguna Anggaran" | "Bendahara Pengeluaran,"
+10: "Pejabat Pembuat Komitmen"
+14: {nama_ppk} | {nama_bendahara}
+15: "NIP. {nip_ppk}" | "NIP. {nip_bendahara}"
```

Nama PPK dan Bendahara diambil dari `users` table berdasarkan role.

**Styling Excel:**
- Font default: Times New Roman 12pt
- Header baris: background `BDD7EE` (biru muda), bold, border thin hitam
- Orientasi landscape, fit to 1 page wide
- Kolom NIK/NPWP/Norek: format `0` (text, tidak pakai separator)
- Kolom uang: format `#,##0`
- Kolom persentase PPh21: format `0%`

---

## BAGIAN 4 — FRONTEND (REACT)

### 4.1 Halaman Input Nominatif PUMK

File: `resources/js/pages/Pumk/PermohonanDana/Nominatif.tsx`

**Layout:**
- Breadcrumb: Dashboard > Permohonan Dana > [Nomor] > Input Nominatif
- Header card dengan info permohonan (nomor, keperluan, status badge)
- Tab per kode akun yang ada (hanya yang `isHonor()` atau `isPerjadin()`)
- Tombol "Simpan Semua Nominatif" di bawah

**Tab Honor (untuk kode_akun 521115, 521213, 522151):**

Tampilkan per item dalam group:
```
[Nama Item — Kode Akun] (misal: "Honorarium Ketua/Wakil Ketua Panitia — 521213")
┌──────────────────────────────────────────────────────────────────────┐
│ No │ Nama Peserta  │ Jabatan  │ Vol │ Harga Satuan │ Jumlah │ PPh21 │ Aksi │
│ 1  │ [Combobox ▼]  │ [Input]  │ [1] │ [300.000]    │ auto   │ [5%]  │ [x]  │
│ +  Tambah Peserta                                                     │
└──────────────────────────────────────────────────────────────────────┘
```

- **Combobox nama peserta:** searchable dropdown dari `ref_pegawai`. Saat pilih, auto-fill: NIK, NPWP, Gol, Rekening, Bank, Email, PPh21 (hidden fields, tidak tampil di tabel tapi dikirim ke server)
- **Vol:** default 1, editable
- **Harga Satuan:** default dari `harga_satuan` item, editable
- **Jumlah:** computed `vol × harga_satuan`, readonly
- **PPh21 (%):** auto dari pegawai, editable
- **Jabatan (521213/522151 saja):** dropdown pilihan: Ketua, Wakil Ketua, Sekretaris, Anggota, Penanggung Jawab, Narasumber, Moderator
- **Untuk 521115:** tidak ada kolom Jabatan
- Tombol tambah baris / hapus baris

**Tab Perjalanan Dinas (524111, 524119, 524113):**

Tampilkan per item dalam group:
```
[Nama Item] misalnya "Uang Harian Biasa" berada di bawah heading "524111 — Perjalanan Dinas Luar Kota"
```

Untuk perjadin, input per **nama peserta** (bukan per item), lalu per komponen perjadin:
```
No │ Nama Peserta │ Transport │ Harian Biasa [Vol│Sat│Jml] │ Fullboard [Vol│Sat│Jml] │ Fullday [Vol│Sat│Jml] │ Representasi │ Taksi PP │ Tiket Pesawat │ Hotel │ Total
```
- Nama peserta: Combobox dari ref_pegawai
- Masing-masing komponen: bisa diisi 0 jika tidak ada
- Total: auto-computed dari semua komponen

### 4.2 Tombol Masuk ke Nominatif

Di halaman `Pumk/PermohonanDana/Index.tsx`, tambahkan per permohonan yang **editable** (draft/rejected) dan punya item honor/perjadin:
- Tombol "📋 Input Nominatif" → link ke `/pumk/permohonan-dana/{id}/nominatif`

### 4.3 Tombol Export di Bendahara

Di halaman `Bendahara/PermohonanDana/Index.tsx`, untuk permohonan yang sudah `dicairkan`:
- Tombol "📥 Download Nominatif" → GET `/bendahara/permohonan-dana/{id}/export-nominatif`

---

## BAGIAN 5 — ROUTES

Tambahkan di `routes/roles/pumk.php`:
```php
Route::get('/permohonan-dana/{pd}/nominatif', [NominatifController::class, 'index'])->name('pumk.permohonan-dana.nominatif');
Route::post('/permohonan-dana/{pd}/nominatif/simpan', [NominatifController::class, 'store'])->name('pumk.permohonan-dana.nominatif.store');
Route::get('/ref-pegawai/search', [NominatifController::class, 'searchPegawai'])->name('pumk.ref-pegawai.search');
```

Tambahkan di `routes/roles/bendahara.php`:
```php
Route::get('/permohonan-dana/{pd}/export-nominatif', [NominatifExportController::class, 'export'])->name('bendahara.permohonan-dana.export-nominatif');
```

---

## BAGIAN 6 — SEEDER DATA MASTER PEGAWAI

Buat `RefPegawaiSeeder` dengan minimal 10 data pegawai contoh. Kolom wajib: nama, nip, nik, npwp, gol_ruang, nama_rekening, norek, nama_bank, email, pph21.

Contoh data sesuai tarif PPh21 aktual:
- PNS Gol II → pph21 = **0**
- PNS Gol III → pph21 = **5.00**
- PNS Gol IV → pph21 = **15.00**
- Non PNS + punya NPWP → pph21 = **3.00**
- Non PNS + tidak punya NPWP → pph21 = **2.50**

---

## CATATAN PENTING IMPLEMENTASI

1. **Snapshot data pegawai:** Saat PUMK simpan nominatif, copy semua field dari `ref_pegawai` ke `permohonan_dana_item_nominatif`. Ini agar perubahan master `ref_pegawai` tidak mempengaruhi data historis.

0. **PPh21 dihitung OTOMATIS berdasarkan Golongan Ruang** saat pegawai didaftarkan ke `ref_pegawai` (bukan diinput manual). Logika ini harus ada di backend saat `store`/`update` RefPegawai:

```php
// Logika auto-hitung PPh21 (dari aplikasi lama SIPITUNG — User.php)
private function hitungPph21(string $gol_ruang, ?string $npwp): float
{
    if ($gol_ruang === 'Non PNS') {
        return $npwp ? 3.0 : 2.5;
    }
    $golongan = explode('/', $gol_ruang)[0]; // ambil bagian sebelum '/'
    return match($golongan) {
        'II'  => 0.0,
        'III' => 5.0,
        'IV'  => 15.0,
        default => 2.5,
    };
}
```

Tabel mapping:
| Kondisi | PPh21 |
|---|---|
| Non PNS + punya NPWP | 3% |
| Non PNS + tanpa NPWP | 2.5% |
| PNS Golongan II (II/b, II/c, II/d) | 0% |
| PNS Golongan III (III/a, III/b, III/c, III/d) | 5% |
| PNS Golongan IV (IV/a s/d IV/e) | 15% |

Field `gol_ruang` di `ref_pegawai` menggunakan enum:
`'II/b','II/c','II/d','III/a','III/b','III/c','III/d','IV/a','IV/b','IV/c','IV/d','IV/e','Non PNS'`

Nilai `pph21` disimpan di database sebagai angka (contoh: `5.0`). Saat generate Excel, bagi 100 sebelum dipakai:
```php
$tarif = $nominatif->pph21 / 100;           // 5.0 / 100 = 0.05
$jumlah_pajak = $jumlah_bruto * $tarif;      // misal: 300000 * 0.05 = 15000
$jumlah_diterima = $jumlah_bruto - $jumlah_pajak; // 300000 - 15000 = 285000
```

2. **Computed field `jumlah_bruto`:** Di MySQL bisa pakai generated column. Di Eloquent, hitung di controller sebelum insert:
   ```php
   $jumlah_bruto = $volume * $harga_satuan;
   $jumlah_pajak = $jumlah_bruto * ($pph21 / 100);
   $jumlah_diterima = $jumlah_bruto - $jumlah_pajak;
   ```

3. **Auto-detect tipe_nominatif:** Di `PermohonanDanaItem`, tambahkan boot method:
   ```php
   static::saving(function ($item) {
     $honor = ['521115', '521213', '522151'];
     $perjadin = ['524111', '524119', '524113'];
     if (in_array($item->kode_akun, $honor)) $item->tipe_nominatif = 'honor';
     else if (in_array($item->kode_akun, $perjadin)) $item->tipe_nominatif = 'perjadin';
     else $item->tipe_nominatif = 'non_nominatif';
   });
   ```

4. **Terbilang function:** Buat helper `terbilang($angka)` untuk konversi angka ke teks Indonesia (dipakai di footer Excel). Install package `kwn/number-to-words` atau implementasi custom.

5. **Format tanggal Indonesia:** Buat helper `tanggalIndonesia($date)` → "27 April 2026".

6. **Guard export:** Hanya Bendahara yang bisa export. Permohonan harus berstatus `dicairkan` atau `pic_approved`.

7. **Validasi frontend:** Warning jika total jumlah_bruto nominatif berbeda jauh dengan total item di `permohonan_dana_item`. Ini hanya warning, bukan block submit.

8. **Sheet pertama kosong:** PhpSpreadsheet/maatwebsite selalu punya 1 sheet default. Hapus sheet pertama yang kosong setelah semua sheet dibuat.

---

## URUTAN IMPLEMENTASI

1. Migration: `ref_pegawai`, `permohonan_dana_item_nominatif`, alter `permohonan_dana` (tgl_nominatif), alter `permohonan_dana_item` (tipe_nominatif)
2. Models: `RefPegawai`, `PermohonanDanaItemNominatif`, update `PermohonanDanaItem`, update `PermohonanDana`
3. Seeder: `RefPegawaiSeeder`
4. Install `maatwebsite/excel`: `composer require maatwebsite/excel`
5. Backend Controllers: `Pumk\NominatifController`, `Bendahara\NominatifExportController`
6. Routes update
7. Export class: `App\Exports\NominatifExport` (multi-sheet, auto-detect format per kode akun)
8. Frontend: `Pumk/PermohonanDana/Nominatif.tsx`
9. Update index pages PUMK dan Bendahara untuk tambah tombol

Implementasi sesuai konvensi project yang sudah ada. Jangan ubah kode yang sudah ada kecuali untuk tambahan yang diperlukan.
