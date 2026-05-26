# Spek UI Input Nominatif Perjadin (524111, 524113, 524114, 524119)

> **Sumber:** kode asli `application/views/permohonan_dana/edit_anggaran.php`, `application/controllers/Permohonan_dana.php`, dan `js-tambahan/editAnggaran.js`.
> **Tujuan:** spek replika 1:1 ke React.

---

## TL;DR (Jawaban Cepat)

| Pertanyaan | Jawaban |
|------------|---------|
| Model input perjadin? | **PER RINCIAN** (bukan per orang). Tiap rincian biaya = satu tabel orang sendiri. |
| UI 524111 vs 524113 vs 524114 vs 524119? | **IDENTIK** — sama-sama tabel "Nama × Volume × Satuan × Harga × Jumlah" per rincian. |
| UI input ada kolom Tiket Pesawat / Hotel / dll terpisah? | **TIDAK.** Yang ada hanya kolom generic Volume/Satuan/Harga/Jumlah. Mapping ke Excel dilakukan via `nama_pekerjaan`. |
| Excel output "satu baris = satu orang dengan banyak komponen"? | **YA**, tapi itu hasil aggregasi controller, bukan struktur input. |

---

## 1. Model Input — Per Kode Akun

### 1.1 Semua perjadin (524111, 524113, 524114, 524119) — Model SAMA

UI input untuk **keempat kode perjadin identik**. Tidak ada perbedaan sama sekali di level form — pengkondisian di kode hanya membedakan **kode honor (521115/521213/522151) vs kode lain (524xxx)** melalui kondisi:

```php
if (substr($kode_subkegiatan, -6, 6) == '521115' || ... '524111' || '524113' || '524114' || '524119' || ...) {
  // Render tabel "per rincian" dengan select Pilih Rincian + tabel orang
}
```

> Semua 7 kode nominatif (521115, 521213, 522151, 524111, 524113, 524114, 524119) **menggunakan model UI yang sama persis**.

### 1.2 Model "Per Rincian" — Bukan "Per Orang"

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Header rincian dari RAB] Nama Pekerjaan | Vol | Sat | Hrg | Jml | ... | 🔍 │   ← baris dari rincian biaya
├──────────────────────────────────────────────────────────────────────────────┤
│  [Klik 🔍 → expand]                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Dropdown "Silakan Pilih Rincian"  [Tambah] [Show/Hide] [Hapus]       │   │
│  │ ┌──────────────────────────────────────────────────────────────────┐ │   │
│  │ │ Nama       │ Detail Identitas │ Rekening │ Vol │ Sat │ Hrg │ Jml│ │   │
│  │ ├──────────────────────────────────────────────────────────────────┤ │   │
│  │ │ Person A   │ NIK/NPWP/Gol     │ No.Rek   │ 3   │ OH  │ 530K│ 1,5M│ │   │
│  │ │ Person B   │ ...              │ ...      │ 3   │ OH  │ 530K│ 1,5M│ │   │
│  │ └──────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

Kunci pemahaman:
- **1 baris rincian biaya RAB = 1 group input** dengan dropdown rincian + tabel peserta sendiri.
- **Dropdown "Silakan Pilih Rincian"** isinya tergantung kode akun (lihat seksi 1.3).
- **Tabel peserta** punya kolom standar: Nama | Detail Identitas | Rekening | Volume | Satuan | Harga Satuan | Jumlah.

### 1.3 Opsi Dropdown "Silakan Pilih Rincian"

Diambil dari array `$akun` di `edit_anggaran.php` (baris 33). Sekarang opsi diambil dari tabel `rincian_akun` via `$rincian_akun` (lihat `foreach ($rincian_akun as ... $options .= ...)`), tapi struktur lama-nya:

| Kode | Opsi Rincian (per kode) |
|------|------------------------|
| **524111** | Biaya Transport Luar Kota/Tiket Pesawat/Kereta Api/Angkutan Umum, Uang Harian Biasa, Uang Harian Fullboard, Uang Harian Fullday/halfday, Uang Representasi Pejabat Eselon II, Biaya Penginapan/Hotel Luar Kota |
| **524113** | Biaya Transport Dalam Kota, Uang Harian Biasa, Uang Harian Fullboard, Uang Harian Fullday/halfday, Uang Representasi Pejabat Eselon II, Biaya Penginapan/Hotel Dalam Kota |
| **524114** | Biaya Transport Dalam Kota, Uang Harian Biasa, Uang Harian Fullboard, Uang Harian Fullday/halfday, Uang Representasi Pejabat Eselon II, Biaya Penginapan/Hotel Luar Kota, Biaya Paket Meeting Dalam Kota |
| **524119** | Biaya Transport Luar Kota/Tiket Pesawat/Kereta Api/Angkutan Umum, Uang Harian Biasa, Uang Harian Fullboard, Uang Harian Fullday/halfday, Uang Representasi Pejabat Eselon II, Biaya Penginapan/Hotel Luar Kota, Biaya Paket Meeting Luar Kota |

> Catatan: nilai opsi yang dipilih **disimpan ke field `keterangan`** di tabel `detail_anggaran_ref` (`name="keterangan[]"`), tapi untuk perjadin nilai ini **tidak dipakai langsung** — yang dipakai adalah `nama_pekerjaan` dari rincian RAB induknya untuk mapping ke kolom Excel (lihat seksi 4).

---

## 2. Struktur Kolom UI Input — Detail Per Cell

### 2.1 Tabel Peserta (yang muncul setelah pilih Rincian + klik Tambah)

Dari kode asli:

| # | Kolom | Tipe Input | Lebar Min | Default | Auto/Manual | Notes |
|---|-------|-----------|-----------|---------|-------------|-------|
| 1 | **Nama** | Select2 (`<select name="ref_nama[]">`) | 300px | "Silakan Pilih Nama" | Manual (dropdown dari `ref_nama`) | Ada input hidden `keterangan[]` di bawahnya untuk simpan jabatan dari dropdown rincian |
| 2 | **Detail Identitas** | Display (read-only) | 260px | NIK / NPWP / Gol / Status | Auto-fill dari onChange `add_Data(this)` | NIK, NPWP, Gol/Ruang, Status tampil sebagai `<p><b>Label:</b> <span></span></p>` |
| 3 | **Rekening** | Display (read-only) | 260px | No.Rek + a.n. | Auto-fill | "No. Rek" + "a.n" |
| 4 | **Volume** | `<input type="number" class="vol-minta">` | default | kosong | Manual | Misal: 3 (hari) |
| 5 | **Satuan** | `<input type="text">` | default | `value="{rincian.satuan}"` (mis. "OH") | **Auto** dari rincian RAB induk, tapi bisa di-override manual | |
| 6 | **Harga Satuan** | `<input type="number" class="hrg-satuan-minta">` | 100px | `value="{rincian.harga_satuan}"` | **Auto** dari rincian RAB induk, bisa di-override | Mis. 530.000 |
| 7 | **Jumlah** | `<input type="text" class="jumlah-minta" readonly>` | 120px | (kosong) | **Auto** = Volume × Harga Satuan, dihitung via JS | `<input type="hidden" name="id_pekerjaan_ref[]">` ikut |

### 2.2 Header Group / Action Bar (di atas tabel peserta)

```html
<div class="form-group d-flex">
  <div class="col-6">
    <select name="posisi[{id_pekerjaan}][]" class="posisi">
      <option>Silakan Pilih Rincian</option>
      <!-- $options dari rincian_akun -->
    </select>
  </div>
  <div class="col-6">
    <button onClick="tambahRincian(this, {id_pekerjaan})">Tambah</button>
    <button onClick="toggleShowHide(this)" class="showHide">Show/Hide</button>
    <button onClick="hapusRincian(this, {id_pekerjaan})" class="hapusRincian d-none">Hapus</button>
  </div>
</div>
```

| Tombol | Fungsi | Default Visibility |
|--------|--------|-------------------|
| **Tambah** | Add baris peserta baru di bawah tabel | Visible |
| **Show/Hide** | Toggle display tabel peserta | Visible |
| **Hapus** | Hapus seluruh group rincian | `d-none` (hidden by default) |

### 2.3 Tombol Hapus Per Baris Peserta

```html
<a class="d-none hapusRef" onClick="hapusReferensi(this)">
  <i class="fa fa-close text-danger"></i>
</a>
```

Default `d-none` (hidden) — kemungkinan di-show via JS saat hover atau kondisi tertentu.

---

## 3. Default Value & Validasi

### 3.1 Default saat baru add baris

| Kolom | Default |
|-------|---------|
| Nama | empty (`<option value="">Silakan Pilih Nama</option>`) |
| Detail Identitas | empty (auto-fill saat pilih nama) |
| Rekening | empty (auto-fill saat pilih nama) |
| Volume | empty (no `value=""`) |
| Satuan | **Auto** dari `$rincian['satuan']` (mis. "OH") |
| Harga Satuan | **Auto** dari `$rincian['harga_satuan']` (dari RAB) |
| Jumlah | empty, readonly, auto-calculated |

### 3.2 Real-time Calculation

Berdasarkan kode JS (perlu lihat `editAnggaran.js`):
- `vol-minta * hrg-satuan-minta = jumlah-minta` (real-time on change)
- Total per rincian: sum semua `jumlah-minta.cls-{id_pekerjaan}` → ditampilkan di **saldo-{id_pekerjaan}**.
- Total subkegiatan: sum semua jumlah → ditampilkan di **totalPermintaan-{id_subkegiatan}**.
- **Validasi**: Sisa anggaran = `dana_subkegiatan - totalPermintaan`. Tidak ada hard validation di kode HTML (validasi dilakukan di server).

### 3.3 Form Submit

Saat klik Simpan (di akhir wizard):
```
POST /permohonan_dana/simpanAnggaran
- id_permohonan
- id_subkegiatan
- dana_subkegiatan
- harga_satuan_da[]
- posisi[{id_pekerjaan}][]      ← rincian terpilih
- ref_nama[]                     ← id pegawai
- keterangan[]                    ← jabatan/rincian
- vol_ref[{id_pekerjaan}][]
- satuan_ref[{id_pekerjaan}][]
- hrg_satuan_ref[{id_pekerjaan}][]
- jumlah_minta_ref[{id_pekerjaan}][]
- id_pekerjaan_ref[]
```

---

## 4. Auto-fill Data Pegawai

Saat pilih nama dari dropdown, JS function `add_Data(this)` di `editAnggaran.js` mengambil data via AJAX dan mengisi:

| Field UI | Field DB (`ref_nama`) | Hidden? |
|----------|----------------------|---------|
| NIK | `nik` | Tampil di "Detail Identitas" |
| NPWP | `npwp` | Tampil di "Detail Identitas" |
| Gol/Ruang | `gol_ruang` | Tampil di "Detail Identitas" |
| Status | `status` | Tampil di "Detail Identitas" |
| No. Rek | `norek_bni` | Tampil di "Rekening" |
| a.n. | `nama_rekening` | Tampil di "Rekening" |
| Email | `email` | **TIDAK tampil di UI**, tapi diambil controller untuk Excel |
| Bank | `namabank` | **TIDAK tampil di UI**, tapi diambil controller untuk Excel |

### Tidak Ada Kolom Jabatan untuk Perjadin

Untuk perjadin (524xxx), **tidak ada kolom Jabatan terpisah** seperti di 521213/522151. Yang ada adalah field `keterangan[]` (hidden text) yang menyimpan opsi rincian ("Uang Harian Biasa", dll.) — tapi bukan jabatan.

---

## 5. Perbedaan 524113 vs 524114 vs 524119

### Di UI Input → **TIDAK ADA PERBEDAAN STRUKTUR**

Yang berbeda **hanya isi dropdown "Silakan Pilih Rincian"**:

| Kode | "Tiket Pesawat" di dropdown? | "Hotel" di dropdown? | "Paket Meeting" di dropdown? |
|------|------------------------------|---------------------|------------------------------|
| 524111 | ✅ (tergabung dalam "Biaya Transport Luar Kota/Tiket Pesawat/...") | ✅ Hotel Luar Kota | ❌ |
| 524113 | ❌ (Transport Dalam Kota saja) | ✅ Hotel Dalam Kota | ❌ |
| 524114 | ❌ (Transport Dalam Kota saja) | ✅ Hotel Luar Kota | ✅ Paket Meeting Dalam Kota |
| 524119 | ✅ (tergabung dalam "Biaya Transport Luar Kota/Tiket Pesawat/...") | ✅ Hotel Luar Kota | ✅ Paket Meeting Luar Kota |

> **Tabel peserta** punya kolom yang sama persis untuk semua 4 kode: Nama / Identitas / Rekening / Vol / Sat / Hrg / Jml.

### Di Excel Output → SEMUA SAMA

Format Excel (header & kolom) **identik untuk 524111, 524113, 524114, 524119** — semua 21 kolom A–U dengan judul "DAFTAR PEMBAYARAN TRANSPORT DAN UANG HARIAN PERJALANAN DINAS".

Perbedaan hanya **nilai per kolom** karena beberapa kolom akan kosong/0:
- 524113 (Dalam Kota): kolom O (Tiket Pesawat) biasanya 0.
- 524114 (Meeting DK): kolom O (Tiket) biasanya 0, tapi N (Taksi) bisa terisi.

---

## 6. Konektivitas UI → Excel (CRITICAL)

### 6.1 Tabel di Database (yang terisi dari UI)

Saat klik Simpan, satu baris di UI = satu row di tabel `detail_anggaran_ref` (alias `dar`):

| Field DB | Sumber UI | Catatan |
|----------|-----------|---------|
| `id_pekerjaan_dar` | dari rincian RAB induk | foreign key ke `detail_anggaran_da` |
| `id_ref` | `ref_nama[]` | id pegawai |
| `keterangan` | `keterangan[]` (di-set dari opsi rincian dropdown) | mis. "Uang Harian Biasa" |
| `vol_dar` | `vol_ref[{id_pekerjaan}][]` | volume |
| `satuan_dar` | `satuan_ref[{id_pekerjaan}][]` | satuan (OH, dll) |
| `harga_satuan_dar` | `hrg_satuan_ref[{id_pekerjaan}][]` | harga |
| `jml_minta_dar` | `jumlah_minta_ref[{id_pekerjaan}][]` | total |

> Data pegawai (NIK, NPWP, Gol, Rekening, Bank, Email) **tidak disimpan ulang** — di-join dari `ref_nama` saat generate Excel.

### 6.2 Mapping UI → Kolom Excel (Aggregasi Controller)

**INI BAGIAN PALING KRUSIAL.** Controller `cetakNominative()` melakukan transformasi:
- **Input:** banyak baris per rincian (banyak orang per "Uang Harian Biasa", banyak orang per "Hotel", dll.).
- **Output Excel:** **satu baris per orang** dengan kolom-kolom Transport / UH Biasa / UH Fullboard / Hotel / dst yang terisi sesuai kontribusi orang itu.

### 6.3 Algoritma Mapping (regex `nama_pekerjaan`)

Controller iterasi `$data['referensi']` (sudah di-group per pegawai), lalu **regex match `nama_pekerjaan`** rincian RAB untuk menentukan kolom Excel:

```php
foreach ($data['referensi'] as $r => $valueRef) {     // per subkegiatan
  if ($r == $value['id_subkegiatan']) {
    foreach ($valueRef as $r2 => $valueRef2) {        // per pegawai
      foreach ($valueRef2 as $r3 => $valueRef3) {     // per rincian yang dia ikuti
        $sheet->setCellValue('B'.$i, $valueRef3['nama']);

        if (preg_match('/uang\s*transport/i', $valueRef3['nama_pekerjaan'])) {
          $sheet->setCellValue('C'.$i, $valueRef3['jml_minta_dar']);   // → kolom C: Transport
        }
        if (preg_match('/uang\s*harian\s*biasa/i', ...)) {
          $sheet->setCellValue('D'.$i, $valueRef3['vol_dar']);          // → D: jml hari biasa
          $sheet->setCellValue('E'.$i, $valueRef3['harga_satuan_dar']); // → E: satuan biasa
          $sheet->setCellValue('F'.$i, $valueRef3['jml_minta_dar']);    // → F: jumlah biasa
        }
        if (preg_match('/uang\s*harian\s*fullboard/i', ...)) {
          // → G, H, I (Fullboard: Vol, Satuan, Jumlah)
        }
        if (preg_match('/uang\s*harian\s*fullday/i', ...)) {
          // → J, K, L (Fullday: Vol, Satuan, Jumlah)
        }
        if (preg_match('/\s*representasi/i', ...)) {
          // → M (Uang Representasi)
        }
        if (preg_match('/\s*transportasi/i', ...)) {
          // → N (Taksi PP)
        }
        if (preg_match('/tiket\s*pesawat/i', ...)) {
          // → O (Tiket Pesawat)
        }
        if (preg_match('/biaya\s*penginapan/i', ...)) {
          // → P (Hotel)
        }
      }
      $i++;  // next row → next pegawai
    }
  }
}
```

### 6.4 Aturan Match (Regex)

| Regex | Kolom Excel | Sumber Data |
|-------|-------------|-------------|
| `/uang\s*transport/i` | C: Transport | `nama_pekerjaan` mengandung "uang transport" |
| `/uang\s*harian\s*biasa/i` | D, E, F: UH Biasa (Vol, Sat, Jml) | "uang harian biasa" |
| `/uang\s*harian\s*fullboard/i` | G, H, I: UH Fullboard | "uang harian fullboard" |
| `/uang\s*harian\s*fullday/i` | J, K, L: UH Fullday | "uang harian fullday" |
| `/\s*representasi/i` | M: Uang Representasi | "representasi" |
| `/\s*transportasi/i` | N: Taksi PP | "transportasi" (note: "transport" vs "transportasi" — beda regex!) |
| `/tiket\s*pesawat/i` | O: Tiket Pesawat | "tiket pesawat" |
| `/biaya\s*penginapan/i` | P: Hotel | "biaya penginapan" |

> [!IMPORTANT]
> Yang dipakai untuk mapping adalah **`nama_pekerjaan`** (nama rincian RAB induk), **BUKAN** `keterangan` (opsi rincian dropdown). Artinya, **PUMK harus pastikan rincian di RAB diberi nama yang konsisten** dengan kata kunci di atas — kalau tidak, kolomnya tidak akan terisi di Excel.

### 6.5 Contoh Konkret

**RAB induk:**
- Rincian 1: "Uang Harian Biasa" → 5 OH × 530.000
- Rincian 2: "Tiket Pesawat" → 1 PP × 1.500.000
- Rincian 3: "Biaya Penginapan Hotel" → 3 OH × 800.000

**UI Input (PUMK isi):**
- Rincian 1 → tabel orang: [Person A: 3 OH], [Person B: 3 OH]
- Rincian 2 → tabel orang: [Person A: 1 PP × 1.500.000], [Person B: 1 PP × 1.500.000]
- Rincian 3 → tabel orang: [Person A: 2 OH × 800.000], [Person B: 2 OH × 800.000]

**Excel Output (transformasi):**
| No | Nama | Transport (C) | UH Biasa Vol (D) | UH Biasa Hrg (E) | UH Biasa Jml (F) | Hotel (P) | Tiket (O) | Total Q |
|----|------|--------------|------------------|------------------|------------------|-----------|-----------|---------|
| 1 | Person A | - | 3 | 530.000 | 1.590.000 | 1.600.000 | 1.500.000 | 4.690.000 |
| 2 | Person B | - | 3 | 530.000 | 1.590.000 | 1.600.000 | 1.500.000 | 4.690.000 |

---

## 7. Implementasi React (Rekomendasi)

### State Shape

```typescript
type RincianGroup = {
  id_pekerjaan: number;          // dari RAB
  nama_pekerjaan: string;         // dari RAB (key utk regex mapping)
  satuan_default: string;
  harga_satuan_default: number;
  rincian_terpilih: string;       // dari dropdown "Pilih Rincian" (= keterangan)
  pesertas: Peserta[];
};

type Peserta = {
  id_ref: number;                 // pilih dari dropdown ref_nama
  nama: string;                   // auto
  nik: string;                    // auto
  npwp: string;                   // auto
  gol_ruang: string;              // auto
  status: string;                 // auto
  norek_bni: string;              // auto
  nama_rekening: string;          // auto
  vol: number;                    // input
  satuan: string;                 // input (default = satuan_default)
  harga_satuan: number;           // input (default = harga_satuan_default)
  jumlah: number;                 // computed = vol * harga_satuan
};

type SubkegiatanForm = {
  id_subkegiatan: number;
  kode_subkegiatan: string;       // '524111' / '524113' / '524114' / '524119'
  dana_subkegiatan: number;
  rincian_groups: RincianGroup[];
};
```

### Komponen Hierarchy

```
<EditAnggaranPerjadin>
├── <SubkegiatanHeader />          // judul, dana, sisa
├── <RABTable>                     // tabel rincian RAB
│   └── <RincianRow>               // per baris RAB
│       └── <PesertaSection>       // expand on 🔍
│           ├── <RincianSelect />  // dropdown "Pilih Rincian"
│           ├── <ActionButtons />  // Tambah / Show-Hide / Hapus
│           └── <PesertaTable>     // tabel orang
│               └── <PesertaRow>   // per orang
└── <FooterTotals />
```

### Validasi

- Real-time: total semua `jumlah` per RincianRow ≤ `volume × harga_satuan` rincian RAB induk.
- Real-time: total subkegiatan ≤ `dana_subkegiatan`.
- Server-side: di endpoint `simpanAnggaran` — harus tetap dipertahankan.

---

## Ringkasan

| Aspek | Spesifikasi |
|-------|-------------|
| Model UI | **Per Rincian** — bukan per orang |
| Kolom UI | Nama, Detail Identitas, Rekening, Vol, Sat, Hrg, Jml (7 kolom standard) |
| 524111/524113/524114/524119 | UI **identik**, beda hanya isi dropdown "Pilih Rincian" |
| Auto-fill | NIK/NPWP/Gol/Status/Rek (display); Email/Bank tidak di UI |
| Default | Satuan & Harga = dari RAB induk; Volume kosong; Jumlah = computed |
| Mapping ke Excel | **Regex pada `nama_pekerjaan` rincian RAB**, bukan `keterangan` opsi |
| Excel format | **Identik** untuk 4 kode perjadin (21 kolom A–U) |
| Aggregasi | Controller transformasi: per orang → 1 baris dengan banyak kolom |
