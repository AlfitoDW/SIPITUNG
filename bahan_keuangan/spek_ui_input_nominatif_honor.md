# Spek UI Input Nominatif Honorarium (521115, 521213, 522151)

> **Sumber:** kode asli `application/views/permohonan_dana/edit_anggaran.php`, `application/controllers/Permohonan_dana.php`, dan `application/controllers/User.php`.
> **Tujuan:** spek replika 1:1 ke React.

---

## TL;DR (Jawaban Cepat)

| Pertanyaan | Jawaban |
|------------|---------|
| UI input honor sama dengan perjadin? | **YA — IDENTIK 100%.** Satu blok rendering yang sama di view. |
| Berapa kolom di tabel input? | **7 kolom**: Nama \| Detail Identitas \| Rekening \| Volume \| Satuan \| Harga Satuan \| Jumlah |
| Ada kolom Bruto/Pajak/Diterima per baris? | **TIDAK.** UI hanya tampilkan Jumlah (Bruto). Pajak & Diterima dihitung saat generate Excel. |
| Ada kolom PPh21% di UI? | **TIDAK.** Tarif disimpan di `ref_nama.pph21`, tidak ditampilkan di form input nominatif. |
| Kolom Jabatan untuk 521213/522151? | **TIDAK ADA kolom terpisah.** Jabatan dipilih dari dropdown "Pilih Rincian" → disimpan ke `keterangan[]`. |

---

## 1. Bukti UI Honor = UI Perjadin

Di `edit_anggaran.php` baris 343, kondisi rendering:

```php
if (substr($kode_subkegiatan, -6, 6) == '521115' 
 || substr($kode_subkegiatan, -6, 6) == '521213' 
 || substr($kode_subkegiatan, -6, 6) == '522151' 
 || substr($kode_subkegiatan, -6, 6) == '524111' 
 || substr($kode_subkegiatan, -6, 6) == '524113' 
 || substr($kode_subkegiatan, -6, 6) == '524114' 
 || substr($kode_subkegiatan, -6, 6) == '524119' 
 || substr($kode_subkegiatan, -6, 6) == '521211' 
 || substr($kode_subkegiatan, -6, 6) == '522141') {
  // SATU blok rendering yang sama untuk semua kode di atas
}
```

Kesimpulan: **Honor (521115/521213/522151) dan Perjadin (524111/524113/524114/524119) menggunakan SATU komponen UI yang sama.** Yang berbeda hanya isi dropdown "Pilih Rincian" dan format Excel output di controller.

> Pengecualian: 521211 (Belanja Bahan) & 522141 (Pemeliharaan) punya cabang UI berbeda — tabel sederhana 4 kolom tanpa kolom nama orang.

---

## 2. Struktur Kolom UI Input Honor (Identik Perjadin)

### Tabel Peserta — 7 Kolom (Kiri ke Kanan)

| # | Kolom | Lebar Min | Tipe Input | Default | Auto/Manual |
|---|-------|-----------|-----------|---------|-------------|
| 1 | **Nama** | 300px | Select2 (`<select name="ref_nama[]">`) | "Silakan Pilih Nama" | Manual (dropdown dari `ref_nama`) |
| 2 | **Detail Identitas** | 260px | Display read-only | NIK / NPWP / Gol/Ruang / Status | Auto-fill via `add_Data(this)` |
| 3 | **Rekening** | 260px | Display read-only | No. Rek + a.n | Auto-fill |
| 4 | **Volume** | default | `<input type="number" class="vol-minta">` | kosong | Manual |
| 5 | **Satuan** | default | `<input type="text">` | `value="{rincian.satuan}"` (mis. "OB", "OK", "Jam") | Auto dari RAB, bisa override |
| 6 | **Harga Satuan** | 100px | `<input type="number" class="hrg-satuan-minta">` | `value="{rincian.harga_satuan}"` | Auto dari RAB, bisa override |
| 7 | **Jumlah** | 120px | `<input type="text" class="jumlah-minta" readonly>` | computed = Vol × Hrg | Auto-calculated |

### Header Group (di atas tabel peserta)

```html
<div class="form-group d-flex">
  <div class="col-6">
    <select name="posisi[{id_pekerjaan}][]" class="posisi">
      <option>Silakan Pilih Rincian</option>
      <!-- $options dari rincian_akun — berbeda per kode -->
    </select>
  </div>
  <div class="col-6">
    <button onClick="tambahRincian(this, {id_pekerjaan})">Tambah</button>
    <button onClick="toggleShowHide(this)" class="showHide">Show/Hide</button>
    <button onClick="hapusRincian(this, {id_pekerjaan})" class="hapusRincian d-none">Hapus</button>
  </div>
</div>
```

---

## 3. Opsi Dropdown "Silakan Pilih Rincian" Per Kode Honor

Diambil dari array `$akun` di `edit_anggaran.php` baris 33 (sekarang dari tabel `rincian_akun` via `$rincian_akun`):

### 521115 — Honor Operasional Satker
> Diambil dari tabel `rincian_akun` (dinamis dari DB, bukan hard-code). Contoh isi:
> - Honorarium Penanggungjawab
> - Honorarium Ketua
> - Honorarium Sekretaris
> - Honorarium Anggota
> *(disesuaikan dengan struktur honor satker yang berlaku)*

### 521213 — Honor Output Kegiatan (Panitia)
| Pilihan Rincian (= nilai `keterangan`) |
|-----------------------------------------|
| Honorarium Penanggungjawab |
| Honorarium Ketua |
| Honorarium Wakil Ketua |
| Honorarium Sekretaris |
| Honorarium Anggota |

### 522151 — Belanja Jasa Profesi (Narasumber)
| Pilihan Rincian (= nilai `keterangan`) |
|-----------------------------------------|
| Honorarium Narasumber (Pejabat Eselon II) |
| Honorarium Narasumber (Pejabat Eselon III) |
| Honorarium Moderator |
| Honorarium Redaktur (Managing Editor) |
| Honorarium Penyunting/Editor |
| Honorarium Sekretariat |
| Honorarium Pembawa Acara |

> Nilai opsi tersimpan di `<input type="hidden" name="keterangan[]">` per peserta. Untuk 521213/522151 (TA >= 2024), nilai inilah yang muncul di **kolom "Jabatan Dalam Tugas"** Excel.

---

## 4. Identitas & Rekening — Tampilan Detail

### Kolom "Detail Identitas" (auto-fill dari `ref_nama`)

```html
<td>
  <p class="row-items"><b>NIK : </b> <span id="nik"></span></p>
  <p class="row-items"><b>NPWP : </b> <span id="npwp"></span></p>
  <p class="row-items"><b>Gol/Ruang : </b> <span id="gol"></span></p>
  <p class="row-items"><b>Status : </b> <span id="status"></span></p>
</td>
```

### Kolom "Rekening" (auto-fill dari `ref_nama`)

```html
<td>
  <p class="row-items"><b>No. Rek : </b> <span id="no_rek"></span></p>
  <p class="row-items"><b>a.n </b> <span id="atas_nama"></span></p>
</td>
```

### Field yang TIDAK Tampil di UI

| Field | Disimpan di | Dipakai untuk |
|-------|-------------|---------------|
| `nip` | `ref_nama.nip` | Excel hanya untuk pejabat (KPA, Bendahara) di footer |
| `email` | `ref_nama.email` | Kolom Email di Excel (kolom P/Q tergantung kode) |
| `namabank` | `ref_nama.namabank` | Kolom Bank di Excel |
| `pph21` | `ref_nama.pph21` | Perhitungan pajak di Excel (kolom J/K Tarif & Pajak) |

---

## 5. Tidak Ada Kolom Bruto/Pajak/Diterima di UI

Di tabel input UI **hanya ada kolom Jumlah** (= Volume × Harga Satuan = Bruto).

Perhitungan Pajak dan Diterima dilakukan **hanya saat generate Excel** di controller `cetakNominative()`:

```php
$pph21 = floatval($value3['pph21']) / 100;     // 5 → 0.05
$pajak = $value3['jml_minta_dar'] * $pph21;    // bruto × tarif
$diterima = $value3['jml_minta_dar'] - $pajak; // bruto - pajak
```

Lalu di-set ke kolom Excel:
- Kolom J (atau K, tergantung kode): Tarif PPh 21 (%)
- Kolom K (atau L): Jumlah Pajak
- Kolom L (atau M): Jumlah Diterima

> **Implication untuk replika React:** UI input honor cukup simple — fokus ke input Vol/Sat/Hrg/Jml saja. Preview pajak (kalau diinginkan) bisa ditambahkan sebagai fitur bonus, tapi bukan kewajiban replika 1:1.

---

## 6. Layout Per Item Rincian (Bukan Satu Tabel Besar)

UI input honor menggunakan **layout per item RAB**, sama seperti perjadin:

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Tabel Utama RAB (parent rows):                                                    │
│ ┌────────────────────────────────────────────────────────────────────────────┐    │
│ │ Uraian              │Vol│Sat│ Hrg Sat │ Jml Anggaran │Terpakai│ Sisa│ Aksi │    │
│ ├────────────────────────────────────────────────────────────────────────────┤    │
│ │ Honorarium Ketua    │ 1 │OK │  2.000K │  2.000.000   │   0    │  2jt│  🔍 │    │
│ ├────────────────────────────────────────────────────────────────────────────┤    │
│ │   ↓ KLIK 🔍 → expand jadi:                                                 │    │
│ │   ┌────────────────────────────────────────────────────────────────────┐   │    │
│ │   │ [Pilih Rincian: Honorarium Ketua▼]  [Tambah] [Show/Hide] [Hapus]   │   │    │
│ │   │ ┌────────────────────────────────────────────────────────────────┐ │   │    │
│ │   │ │Nama       │Detail Identitas│Rekening │Vol│Sat│Hrg Sat│ Jumlah  │ │   │    │
│ │   │ ├────────────────────────────────────────────────────────────────┤ │   │    │
│ │   │ │[Asri F.A▼]│NIK: 320...     │No.Rek:..│ 1 │OK │2.000K │ 2.000K  │ │   │    │
│ │   │ │           │NPWP: ...       │a.n: ... │   │   │       │         │ │   │    │
│ │   │ │ ket(hidden)│Gol: III/d     │         │   │   │       │         │ │   │    │
│ │   │ │           │Status: PNS     │         │   │   │       │         │ │   │    │
│ │   │ └────────────────────────────────────────────────────────────────┘ │   │    │
│ │   └────────────────────────────────────────────────────────────────────┘   │    │
│ ├────────────────────────────────────────────────────────────────────────────┤    │
│ │ Honorarium Sekretaris│ 1 │OK │ 1.500K │  1.500.000   │   0    │1,5jt│  🔍 │    │
│ │ ...                                                                        │    │
│ └────────────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

- Setiap baris RAB punya tabel peserta sendiri.
- **Expand/Collapse** via tombol "Show/Hide" (`onClick="toggleShowHide(this)"`).
- **Tambah peserta** via tombol "Tambah" (`onClick="tambahRincian(...)"`).
- **Hapus group** via tombol "Hapus" (default `d-none`, dimunculkan via JS sesuai kondisi).
- **Hapus per peserta** via icon ✕ (`class="d-none hapusRef"`).

---

## 7. Perbandingan UI Honor vs Perjadin

| Aspek | Honor (521115/521213/522151) | Perjadin (524111/524113/524114/524119) |
|-------|------------------------------|----------------------------------------|
| **Struktur form input** | **IDENTIK** | **IDENTIK** |
| **7 kolom tabel peserta** | Sama persis | Sama persis |
| **Tombol-tombol** | Sama (Tambah, Show/Hide, Hapus) | Sama |
| **Auto-fill identitas** | Sama (NIK/NPWP/Gol/Status/Rek) | Sama |
| **Field hidden `keterangan[]`** | Ada — simpan jabatan | Ada — simpan jenis biaya |
| **Validasi** | Sama (sisa anggaran) | Sama |
| **Isi dropdown "Pilih Rincian"** | Jabatan ("Honorarium Ketua", dst) | Komponen biaya ("Uang Harian Biasa", dst) |
| **Pakai field `keterangan` di Excel?** | **YA** — jadi kolom "Jabatan Dalam Tugas" (untuk 521213/522151) | **TIDAK** — Excel pakai regex `nama_pekerjaan` |
| **Format Excel output** | Berbeda format header & jumlah kolom (16 kol untuk 521115, 17 kol untuk 521213/522151) | 21 kol untuk semua 524xxx |
| **Reference dokumen di Excel** | No SK & Tgl SK | No ST & Tgl ST |

**Yang sama 100%:** Form input UI, struktur tabel, tombol, auto-fill, validasi.
**Yang beda:** Isi dropdown opsi, mapping ke kolom Excel, format Excel output.

---

## 8. PPh 21 — Tabel Tarif (referensi)

Tarif disimpan di `ref_nama.pph21` saat input pegawai (lihat `User.php` line 109–129):

| Status / Golongan | NPWP | Tarif | Disimpan sebagai |
|------------------|------|-------|------------------|
| Non PNS | Punya NPWP | **3%** | `pph21 = 3` |
| Non PNS | Tidak punya | **2,5%** | `pph21 = 2.5` |
| PNS Gol II (II/a–II/d) | — | **0%** | `pph21 = 0` |
| PNS Gol III (III/a–III/d) | — | **5%** | `pph21 = 5` |
| PNS Gol IV (IV/a–IV/e) | — | **15%** | `pph21 = 15` |

Dipakai saat Excel:
```php
$pph21 = floatval($value3['pph21']) / 100;     // 5 → 0.05
$pajak = $value3['jml_minta_dar'] * $pph21;
$diterima = $value3['jml_minta_dar'] - $pajak;
```

---

## 9. Konektivitas UI → Excel (Honor Specific)

### Tabel `detail_anggaran_ref` (dar) — yang diisi dari UI

| Field DB | Sumber UI |
|----------|-----------|
| `id_pekerjaan_dar` | rincian RAB induk |
| `id_ref` | `ref_nama[]` (id pegawai) |
| `keterangan` | `keterangan[]` (dari opsi dropdown rincian) |
| `vol_dar` | `vol_ref[{id_pekerjaan}][]` |
| `satuan_dar` | `satuan_ref[{id_pekerjaan}][]` |
| `harga_satuan_dar` | `hrg_satuan_ref[{id_pekerjaan}][]` |
| `jml_minta_dar` | `jumlah_minta_ref[{id_pekerjaan}][]` |

### Mapping ke Excel

#### 521115 — Format A (16 kol, A–P)
- 1 baris UI = 1 baris Excel langsung (no aggregation).
- **Kolom Excel = mapping langsung dari field DB:**
  - A: No urut
  - B: Nama (`nama` dari `ref_nama`)
  - C: NIK
  - D: NPWP
  - E: Gol/Ruang
  - F: Vol (= `vol_dar`) → "Jml Keg"
  - G: Hrg (= `harga_satuan_dar`) → "Rp./Jam"
  - H: Bruto (= `jml_minta_dar`) → "Jml Bruto"
  - I: DPP (= `jml_minta_dar`)
  - J: Tarif PPh 21 (= `pph21/100`)
  - K: Jml Pajak (= computed)
  - L: Jml Diterima (= computed)
  - M: a.n. Rekening
  - N: No Rekening
  - O: Bank
  - P: Email

#### 521213 / 522151 — Format B (17 kol, A–Q)
- 1 baris UI = 1 baris Excel langsung.
- **Beda dengan 521115:** ada **kolom C "Jabatan Dalam Tugas"** yang mengambil dari field `keterangan` (TA >= 2024).

```php
if ($this->ss->userdata('TA') >= '2024') {
    $isJabatan = $value3['keterangan'];   // dari dropdown "Pilih Rincian"
} else {
    $isJabatan = strpos(strtolower($isi['nama_pekerjaan']), 'ketua') ? 'Ketua' 
              : (strpos(strtolower($isi['nama_pekerjaan']), 'sekretaris') ? 'Sekretaris' 
              : ...);   // regex pada nama_pekerjaan utk TA lama
}
```

> **PENTING:** Untuk TA <= 2023, jabatan diparse via regex dari `nama_pekerjaan` rincian RAB induk. Untuk TA >= 2024, langsung pakai field `keterangan` (yang diisi dari dropdown rincian di UI).

---

## 10. Implementasi React (Rekomendasi)

### Komponen Reusable

Karena UI honor & perjadin **identik**, buat 1 komponen `<NominatifInput>` reusable:

```typescript
type NominatifProps = {
  kode_akun: '521115' | '521213' | '522151' | '524111' | '524113' | '524114' | '524119';
  rincian_options: string[];        // dari rincian_akun (DB) per kode
  rincian_groups: RincianGroup[];   // baris RAB
  onSubmit: (data) => void;
};
```

### State Shape (sama dengan perjadin)

```typescript
type RincianGroup = {
  id_pekerjaan: number;
  nama_pekerjaan: string;        // nama rincian dari RAB
  satuan_default: string;
  harga_satuan_default: number;
  rincian_terpilih: string;      // dari dropdown "Pilih Rincian" → keterangan
  pesertas: Peserta[];
};

type Peserta = {
  id_ref: number;
  nama: string;
  nik: string;
  npwp: string;
  gol_ruang: string;
  status: string;
  norek_bni: string;
  nama_rekening: string;
  vol: number;
  satuan: string;
  harga_satuan: number;
  jumlah: number;                 // computed
};
```

### Komponen Hierarchy

```
<NominatifInput kode_akun={kode}>
├── <SubkegiatanHeader />
├── <RABTable>
│   └── <RincianRow>             // per baris RAB
│       └── <PesertaSection>     // expand on 🔍
│           ├── <RincianSelect options={rincian_options} />  // dropdown jabatan/biaya
│           ├── <ActionButtons />
│           └── <PesertaTable>
│               └── <PesertaRow>
└── <FooterTotals />
```

---

## Ringkasan Final

| Aspek | Spesifikasi Honor |
|-------|-------------------|
| Model UI | **Per Rincian** (bukan per orang) — sama dengan perjadin |
| Kolom UI | 7 kolom standar — **identik dengan perjadin** |
| Ada kolom Bruto/Pajak/Diterima? | **TIDAK** di UI, ada di Excel |
| Ada kolom PPh 21%? | **TIDAK** di UI, dipakai di Excel |
| Ada kolom Satuan? | **YA** (auto dari RAB, bisa override) |
| Ada kolom Jabatan? | **TIDAK terpisah**, pakai dropdown "Pilih Rincian" → simpan di `keterangan[]` |
| Identitas tampil di UI? | **YA** kolom "Detail Identitas" (NIK/NPWP/Gol/Status) |
| Rekening tampil di UI? | **YA** kolom "Rekening" (No.Rek + a.n.) |
| Email/Bank tampil di UI? | **TIDAK**, dipakai controller untuk Excel |
| Per item atau satu tabel? | **Per item** RAB (dengan expand/collapse) |
| Mirip perjadin? | **IDENTIK 100%** di form input |
| Bedanya dengan perjadin? | (1) Isi dropdown rincian, (2) Format Excel output |

**Simpulan untuk implementasi:** Cukup **1 komponen React reusable** untuk semua 7 kode nominatif. Variasi per kode hanya di prop `rincian_options` dan logic export Excel.
