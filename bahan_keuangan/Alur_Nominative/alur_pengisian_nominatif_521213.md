# Alur Pengisian Nominatif 521213 — Belanja Honor Output Kegiatan (Panitia)

## Jawaban Singkat

Pengisian dilakukan **per orang** untuk setiap item rincian biaya berkode `521213`. PUMK memilih nama peserta, mengisi **Jabatan dalam Tugas** (Ketua, Anggota, dll), volume, dan harga satuan. Format B ini memiliki **kolom Jabatan** — berbeda dengan Format A (521115).

---

## Siapa yang Mengisi?

| Role | Aksi |
|------|------|
| **PUMK (role pumk)** | Mengisi seluruh data nominatif per orang per item |
| **Bendahara** | Hanya klik "Download Nominatif" → Export Excel |

> [!IMPORTANT]
> **PUMK yang melakukan seluruh pengisian.** Bendahara hanya men-generate output Excel.

---

## Perbedaan Format B vs Format A

| Aspek | Format B (521213, 522151) | Format A (521115) |
|-------|--------------------------|-------------------|
| Kolom Jabatan | ✅ Ada (Ketua, Anggota, dll) | ❌ Tidak ada |
| Kolom Excel | A–Q (17 kolom) | A–P (16 kolom) |
| Judul Excel | "DAFTAR PEMBAYARAN HONORARIUM PANITIA" | "DAFTAR PEMBAYARAN HONORARIUM OPERASIONAL" |
| Referensi SK/ST | Nomor SK | Nomor SK |

---

## Alur Pengisian Step-by-Step

### Contoh Kasus:
```
521213 - Belanja Honor Output Kegiatan
├── 01 Honorarium Ketua/Wakil Ketua Panitia  [1 OK x 1 KEG]
├── 02 Honorarium Sekretaris Panitia          [1 OK x 1 KEG]
└── 03 Honorarium Anggota Panitia             [5 OK x 1 KEG]
```

### Step 1: PUMK membuka halaman Input Nominatif

PUMK membuka halaman **Input Nominatif** dari permohonan dana yang berstatus `draft` atau `rejected`. Klik tab `521213`.

```
┌─────────────────────────────────────────────────────────────────────┐
│ Tab: [521115] [521213] [524111] ...                                 │
├─────────────────────────────────────────────────────────────────────┤
│ 521213 — Belanja Honor Output Kegiatan (Panitia)                   │
│                                                                     │
│ ▼ 01 Honorarium Ketua/Wakil Ketua Panitia  [1 OK × Rp 500.000]    │
│ ┌────┬──────────────────┬──────────────────┬─────┬────────┬──────┐  │
│ │ No │ Nama Peserta     │ Jabatan          │ Vol │ Jumlah │ PPh  │  │
│ ├────┼──────────────────┼──────────────────┼─────┼────────┼──────┤  │
│ │  1 │ [Combobox ▼]     │ [Ketua ▼]        │  1  │ auto   │  5%  │  │
│ │  + Tambah Peserta                                               │  │
│ └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Step 2: PUMK mengisi data per orang per item

#### Field yang diisi PUMK:

| Field | Cara Input | Keterangan |
|-------|-----------|------------|
| **Nama Peserta** | Combobox searchable dari `ref_pegawai` | Ketik nama → pilih dari dropdown |
| **Jabatan dalam Tugas** | Dropdown pilihan | Lihat opsi di bawah |
| **Volume** | Input angka | Jumlah kegiatan/jam. Default: 1 |
| **Harga Satuan** | Input angka | Default dari `harga_satuan` item, bisa diedit |
| **PPh21 (%)** | Auto dari pegawai, editable | Misal: 5% untuk Gol III |

#### Opsi Jabatan dalam Tugas (521213) — dari kode asli `edit_anggaran.php`:

| Pilihan Jabatan (nilai `keterangan`) |
|--------------------------------------|
| Honorarium Penanggungjawab |
| Honorarium Ketua |
| Honorarium Wakil Ketua |
| Honorarium Sekretaris |
| Honorarium Anggota |

> Nilai ini disimpan di field `keterangan` di `detail_anggaran_ref`, dan dipakai langsung sebagai isi kolom "Jabatan Dalam Tugas" di Excel (untuk TA >= 2024).

#### Field yang otomatis terisi saat pilih nama:

| Field | Sumber |
|-------|--------|
| NIK | `ref_pegawai.nik` |
| NPWP | `ref_pegawai.npwp` |
| Gol/Ruang | `ref_pegawai.gol_ruang` |
| Nama Rekening | `ref_pegawai.nama_rekening` |
| Nomor Rekening | `ref_pegawai.norek` |
| Bank | `ref_pegawai.nama_bank` |
| Email | `ref_pegawai.email` |
| PPh21 | `ref_pegawai.pph21` |

### Step 3: Kalkulasi otomatis

```
Jumlah Bruto    = Volume × Harga Satuan
Jumlah Pajak    = Jumlah Bruto × (PPh21 / 100)
Jumlah Diterima = Jumlah Bruto − Jumlah Pajak
```

Contoh:
```
Vol: 1 × Hrg: 500.000 = Bruto: 500.000
PPh21: 5% → Pajak: 25.000
Diterima: 475.000
```

### Step 4: Simpan semua

Klik tombol **"Simpan Semua Nominatif"** → semua data dikirim ke `POST /pumk/permohonan-dana/{id}/nominatif/simpan`.

---

## Detail Teknis Penyimpanan

### Tabel `permohonan_dana_item_nominatif` — kolom yang dipakai untuk 521213:

```
permohonan_dana_item_id  → FK ke item 521213
permohonan_dana_id       → FK ke permohonan
ref_pegawai_id           → FK ke ref_pegawai
nama, nip, nik, npwp, gol_ruang, nama_rekening, norek, nama_bank, email, pph21  → snapshot
jabatan                  → "Ketua" / "Wakil Ketua" / "Sekretaris" / "Anggota" / "Penanggung Jawab"
volume                   → jumlah kegiatan
harga_satuan             → harga per satuan
jumlah_bruto             → volume × harga_satuan
jumlah_pajak             → jumlah_bruto × (pph21/100)
jumlah_diterima          → jumlah_bruto − jumlah_pajak
```

> Kolom perjadin (`transport`, `uang_harian_*`, `hotel`, dll) **tidak dipakai** untuk kode honor.

---

## Format Excel Output (Format B)

Header baris 11–13:

```
No | Nama | Jabatan Dalam Tugas | NIK | NPWP | Gol | Honorarium [Jml Keg | Rp/Jam | Jml Bruto] | DPP [PNS/Non PNS] | PPH21 [Tarif | Jml Pajak] | Jumlah Diterima | Atas Nama Rekening | Nomor Rekening | Bank | Email
```

Kolom A–Q (17 kolom). **Ada kolom Jabatan Dalam Tugas** di posisi kolom C.

Header (baris 1–13, dari kode asli controller):
```
Baris 1: "Lampiran :"
Baris 2: "Surat Keputusan Kepala LLDIKTI Wilayah III selaku KPA"
Baris 3: "Nomor : {no_sk} Tanggal {tgl_sk}"
Baris 5: "DAFTAR PEMBAYARAN HONORARIUM PANITIA"
Baris 6: "KEGIATAN {JUDUL_KEGIATAN_UPPERCASE}"
Baris 7: "DI LINGKUNGAN LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III JAKARTA TAHUN ANGGARAN {tahun}"
Baris 8: "DI {TEMPAT_UPPERCASE} TANGGAL {tgl_pelaksanaan_uppercase}"
Baris 9: "521213 {nama_subkegiatan}"
```

Data header kolom (baris 11–13):
```
Baris 11: No | Nama | Jabatan Dalam Tugas | NIK | NPWP | Gol | Honorarium | DPP | PPH 21 | Jumlah Diterima | Atas Nama Rekening | Nomor Rekening | Bank | Email
Baris 12: (sub-header: Jml Keg | Rp./Jam | Jml Bruto | PNS/Non PNS | Tarif** | Jml Pajak)
Baris 13: A | B | C | D | E | F | G | H=FxG | I=H | J | K=(JxI) | L=(H-K) | M | N | O | P | Q
```

> [!IMPORTANT]
> **Jabatan diambil dari field `keterangan`** di tabel `detail_anggaran_ref` (untuk TA >= 2024). Nilai keterangan ini diisi PUMK saat input nominatif via dropdown. Untuk TA lama, jabatan di-parse dari nama pekerjaan.

Tab color Excel: **F4B084** (orange — kode honor).

---

## Diagram Alur Lengkap

```mermaid
flowchart TD
    A["PUMK buka Input Nominatif\nTab: 521213"] --> B["Tampil semua item 521213:\n01 Honorarium Ketua/Wakil Ketua\n02 Honorarium Sekretaris\n03 Honorarium Anggota"]
    
    B --> C1["▼ Expand item 01\nHonorarium Ketua/Wakil Ketua"]
    B --> C2["▼ Expand item 02\nHonorarium Sekretaris"]
    B --> C3["▼ Expand item 03\nHonorarium Anggota"]
    
    C1 --> D1["Pilih Nama: Budi\nJabatan: Ketua\nVol: 1, Hrg: 500.000"]
    D1 --> E1["Auto: Bruto 500.000\nPajak 25.000, Diterima 475.000"]
    E1 --> F1["Tambah baris: Ani\nJabatan: Wakil Ketua\n..."]
    
    C2 --> D2["Pilih Nama: Doni\nJabatan: Sekretaris\nVol: 1, Hrg: 400.000"]
    
    C3 --> D3["Pilih Nama: Rina\nJabatan: Anggota\nVol: 1, Hrg: 300.000"]
    D3 --> E3["...ulangi 5 orang anggota"]
    
    F1 --> G["Klik SIMPAN SEMUA NOMINATIF"]
    D2 --> G
    E3 --> G
    G --> H["POST /pumk/permohonan-dana/{id}/nominatif/simpan"]
    H --> I["Delete existing → Insert baru\nHitung pajak di backend"]
    I --> J["INSERT permohonan_dana_item_nominatif\n(jabatan = 'Ketua'/'Anggota'/dll)"]
    
    J --> K["Bendahara: Download Nominatif"]
    K --> L["Export Excel Format B\n(17 kolom, ada Jabatan)\nTab orange F4B084"]
```

---

## Tarif PPh21 Referensi

| Kondisi Pegawai | Tarif PPh21 |
|----------------|-------------|
| PNS Golongan II (II/b, II/c, II/d) | 0% |
| PNS Golongan III (III/a–III/d) | 5% |
| PNS Golongan IV (IV/a–IV/e) | 15% |
| Non PNS + punya NPWP | 3% |
| Non PNS + tanpa NPWP | 2.5% |

---

## Kesimpulan

| Pertanyaan | Jawaban |
|-----------|---------|
| **Ada kolom Jabatan?** | **Ya.** Format B punya kolom Jabatan Dalam Tugas. |
| **Opsi jabatan apa saja?** | Ketua, Wakil Ketua, Sekretaris, Anggota, Penanggung Jawab. |
| **Input per orang atau total?** | **Per orang.** Setiap peserta diinput satu baris. |
| **Siapa yang mengisi?** | **PUMK** mengisi semua. Bendahara hanya export Excel. |
| **Kolom Excel berapa?** | **17 kolom (A–Q).** Ada kolom Jabatan. |
| **Warna tab Excel?** | **Orange (F4B084)** — sama dengan semua kode honor. |
| **Referensi dokumen?** | Nomor SK dan Tanggal SK. |
