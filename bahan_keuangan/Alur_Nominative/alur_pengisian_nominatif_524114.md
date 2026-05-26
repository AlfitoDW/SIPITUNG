# Alur Pengisian Nominatif 524114 — Belanja Perjalanan Dinas Paket Meeting Dalam Kota

## Jawaban Singkat

Pengisian dilakukan **per orang** dengan mengisi komponen biaya perjalanan dinas paket meeting dalam kota. Konteksnya adalah kegiatan rapat/meeting yang dilaksanakan **di dalam kota** (tidak perlu tiket pesawat/kereta, tapi bisa ada hotel jika menginap). Format Excel **identik dengan 524111, 524119, dan 524113** — kolom A–U (21 kolom).

---

## Siapa yang Mengisi?

| Role | Aksi |
|------|------|
| **PUMK (role 7)** | Mengisi seluruh data nominatif per orang per item |
| **Bendahara (role 4/BP)** | Hanya klik "Download Nominatif" → Export Excel |

---

## Perbedaan 524114 vs Kode Perjadin Lain

| Aspek | 524114 (Paket Meeting DK) | 524113 (Perjadin DK) | 524119 (Paket Meeting LK) | 524111 (Perjadin LK) |
|-------|--------------------------|----------------------|--------------------------|----------------------|
| Konteks | Rapat/meeting dalam kota, bisa menginap | Perjadin dalam kota biasa | Rapat/meeting luar kota | Perjadin luar kota biasa |
| Hotel | ✅ Bisa ada (menginap dalam kota) | ❌ Biasanya tidak | ✅ Bisa ada | ✅ Bisa ada |
| Tiket Pesawat | ❌ Tidak ada | ❌ Tidak ada | ✅ Bisa ada | ✅ Bisa ada |
| Fullboard/Fullday | ✅ Utama (paket meeting) | ❌ Biasanya tidak | ✅ Utama | ✅ Bisa ada |
| Format Excel | **Identik** (A–U, 21 kolom) | **Identik** | **Identik** | **Identik** |
| Tab color | Biru 00B0F0 | Biru 00B0F0 | Biru 00B0F0 | Biru 00B0F0 |

---

## Opsi Rincian (dari `edit_anggaran.php`)

Saat PUMK klik 🔍 pada baris rincian 524114, dropdown "Silakan Pilih Rincian" menampilkan:

| Opsi Rincian (`keterangan`) |
|-----------------------------|
| Biaya Transport Dalam Kota |
| Uang Harian Biasa |
| Uang Harian Fullboard |
| Uang Harian Fullday/halfday |
| Uang Representasi Pejabat Eselon II |
| Biaya Penginapan/Hotel Luar Kota |
| Biaya Paket Meeting Dalam Kota |

---

## Alur Pengisian Step-by-Step

### Step 1: PUMK membuka halaman Edit Anggaran

PUMK membuka form **Edit Anggaran** sub-kegiatan 524114. Tampil semua baris rincian biaya, PUMK klik 🔍 per baris untuk expand detail.

### Step 2: PUMK mengisi data per orang per rincian

Untuk setiap baris rincian, PUMK memilih nama peserta dan mengisi komponen biaya yang relevan:

| Field | Cara Input | Keterangan |
|-------|-----------|------------|
| **Nama** | Dropdown Select2 dari `ref_nama` | Pilih dari master data pegawai |
| **Rincian** | Dropdown `posisi[]` | Pilih jenis biaya (lihat opsi di atas) |
| **Volume** | Input manual | Misal: 2 (hari) |
| **Satuan** | Input manual | Misal: "OH" |
| **Harga Satuan** | Input/auto | Misal: 530.000 |

Identitas (NIK, NPWP, Gol, Rekening) **otomatis terisi** dari master `ref_nama`.

### Step 3: Simpan

Klik **"Simpan"** → data semua rincian + semua orang dikirim ke `simpanAnggaran()`.

---

## Format Excel Output

Header (baris 1–13, dari kode asli controller — **identik dengan 524111, 524119, 524113**):
```
Baris 1: "Lampiran :"
Baris 2: "Surat Keputusan Kepala LLDIKTI Wilayah III selaku KPA"
Baris 3: "Nomor : {no_st} Tanggal {tgl_st}"   ← pakai ST, bukan SK
Baris 5: "DAFTAR PEMBAYARAN TRANSPORT DAN UANG HARIAN PERJALANAN DINAS"
Baris 6: "KEGIATAN {JUDUL_KEGIATAN_UPPERCASE}"
Baris 7: "DI LINGKUNGAN LEMBAGA LAYANAN PENDIDIKAN TINGGI WILAYAH III JAKARTA TAHUN ANGGARAN {tahun}"
Baris 8: "DI {TEMPAT_UPPERCASE} TANGGAL {tgl_pelaksanaan_uppercase}"
Baris 9: "524114 {nama_subkegiatan}"
```

Data header kolom (baris 11–13):
```
Baris 11: No | Nama | Transport (Rp.) | Uang Harian Biasa | Uang Harian Fullboard | Uang Harian Fullday | Uang Representasi | Taksi PP | Tiket Pesawat | Akomodasi Hotel | Jumlah Diterima (Rp) | Atas Nama Rekening | Nomor Rekening | Bank | Email
Baris 12: (sub-header: Jml Hari | Satuan | Jumlah — untuk masing-masing Harian/Fullboard/Fullday)
Baris 13: A | B | C | D | E | F=DxE | G | H | I=GxH | J | K | L=JxK | M | N | O | P | Q=C+F+I+L | R | S | T | U
```

Tab color Excel: **00B0F0** (biru — semua kode perjadin).

---

## Kesimpulan

| Pertanyaan | Jawaban |
|-----------|---------|
| **Format Excel sama dengan 524111?** | **Ya, identik.** Controller menggunakan blok terpisah tapi struktur header sama persis. |
| **Referensi dokumen?** | **Nomor ST** (Surat Tugas) dan Tanggal ST. |
| **Kolom Excel berapa?** | **21 kolom (A–U).** |
| **Warna tab Excel?** | **Biru (00B0F0).** |
| **Komponen utama?** | Fullboard/Fullday (paket meeting dalam kota). Transport dan hotel bisa ada. Tiket pesawat biasanya 0. |
