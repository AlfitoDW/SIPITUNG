# Desain Modul Permohonan Dana — PUMK
## Rev. DJA Prioritas Direktif Presiden TA 2026 (19-12-25)

---

## ALUR KESELURUHAN

```
[1] Form Awal → Simpan Draft
       ↓
[2] Wizard 4 Tahap (edit/lengkapi data)
       ↓ Tahap 1: Review Kegiatan
       ↓ Tahap 2: Waktu & Penanggung Jawab
       ↓ Tahap 3: Dokumen Pendukung
       ↓ Tahap 4: Rincian Biaya
       ↓
[3] "Ajukan Permohonan" → status: submitted → ke approval KA.TIM
```

---

## BAGIAN 1 — FORM AWAL (Simpan Draft)

Form ini muncul saat PUMK klik **"Buat Permohonan Baru"**.

### Section A — Identitas

| Field | Tipe | Keterangan |
|---|---|---|
| No. Permohonan | Read-only | Auto-generate: `003/LL3/PerD/IV/2026` |
| Tanggal | Date | Default: hari ini |
| Dibuat Oleh | Read-only | Dari akun login |

### Section B — Hierarki Anggaran (Cascading Dropdown)

| Field | Tipe | Contoh |
|---|---|---|
| Program | Select | `023.01.DK — Program Pendidikan Tinggi` |
| Sasaran | Select (cascade) | `4472 — Pembinaan Kelembagaan Pendidikan Tinggi` |
| KRO | Select (cascade) | `4472.BDB — Fasilitasi dan Pembinaan Lembaga` |
| RO | Select (cascade) | `4472.BDB.001 — Lembaga PT ... pembinaan mutu` |
| Komponen | Select (cascade) | `051 — Pembinaan dan Evaluasi Lapangan ...` |
| Kegiatan | Select (cascade) | `A — Monitoring, Evaluasi, dan Penataan Legalitas PTS` |
| Pagu Kegiatan | Info box | `Rp 527.592.000` (read-only, muncul setelah pilih Kegiatan) |

### Section C — Judul Pekerjaan

| Field | Tipe | Keterangan |
|---|---|---|
| Judul Pekerjaan | Text Input | Nama spesifik pekerjaan |

### Tombol
- **Simpan sebagai Draft** → redirect ke halaman wizard (Tahap 1)
- **Batal**

---

## BAGIAN 2 — WIZARD 4 TAHAP (setelah draft tersimpan)

Header wizard selalu tampil:
```
DRAFT PERMOHONAN DANA
Pengajuan Pendanaan Kegiatan

[ 1 Kegiatan ] → [ 2 Waktu & PJ ] → [ 3 Dokumen Pendukung ] → [ 4 Rincian Biaya ]
```

---

### TAHAP 1 — Kegiatan (Review, Read-Only)

Menampilkan ulang data yang sudah diisi di form awal. **Tidak ada input baru**, hanya konfirmasi.

| Label | Contoh Nilai |
|---|---|
| No. Permohonan | `003/LL3/PerD/IV/2026` |
| Tanggal Pembuatan | `27-04-2026` |
| Dibuat Oleh | `Risma Testir` |
| Program | `Program Pendidikan Tinggi` |
| Sasaran | `Pembinaan Kelembagaan Pendidikan Tinggi` |
| Klasifikasi Rincian Output [KRO] | `Fasilitasi dan Pembinaan Lembaga [Base Line]` |
| Rincian Output [RO] | `Lembaga PT Akademik dan Vokasi yang mendapatkan layanan pembinaan peningkatan mutu` |
| Komponen | `Pembinaan dan Evaluasi Lapangan Pengendalian Perguruan Tinggi` |
| Kegiatan | `Monitoring, Evaluasi, dan Penataan Legalitas PTS` |
| Judul Pekerjaan | `(teks yang diisi PUMK)` |

**Navigasi:** `[Selanjutnya →]`

---

### TAHAP 2 — Waktu dan Penanggung Jawab

Semua field di tahap ini **wajib** diisi.

| Field | Tipe | Keterangan |
|---|---|---|
| Tanggal Pelaksanaan | Date | Tanggal mulai kegiatan |
| Tanggal Pelaksanaan Akhir | Date | Harus ≥ Tanggal Mulai |
| Jam Pelaksanaan | Time | Format HH:MM, contoh `07:30` |
| Kapokja Kegiatan | Select | User role `ketua_tim_kerja` — tampil: `Nama — TIM xxx` |
| Tempat Pelaksanaan | Text Input | Lokasi kegiatan |
| Waktu Penyelesaian Pertanggungjawaban | Date | Batas LPJ |
| PIC Keuangan | Select | User role `pic_keuangan` — tampil: `Nama — PIC Keuangan` |

**Navigasi:** `[← Sebelumnya]` `[Selanjutnya →]`

---

### TAHAP 3 — Dokumen Pendukung

PUMK bisa upload dokumen per jenis. **Multi-dokumen** didukung, termasuk lebih dari 1 file untuk jenis "Dokumen Lainnya" (drag & drop).

#### Jenis Dokumen (dropdown Pilih Jenis Dokumen):

| ID | Nama Jenis Dokumen |
|---|---|
| 1 | Rincian Kebutuhan Biaya |
| 2 | Surat Keputusan Pelaksanaan Kegiatan |
| 3 | Surat Tugas Kepanitian |
| 4 | Surat Undangan Kegiatan |
| 5 | Surat Pernyataan Kegiatan Luar Kantor |
| 6 | Kuitansi / Bukti Pembayaran |
| 7 | SPK / Surat Perjanjian |
| 8 | Dokumen Lainnya |

#### Cara Kerja Upload:
1. Pilih **Jenis Dokumen** dari dropdown
2. Pilih **File** (input file, bisa drag & drop)
3. Klik **Tambah** → masuk ke tabel daftar dokumen
4. Bisa tambah beberapa dokumen berbeda jenis
5. Untuk "Dokumen Lainnya" bisa upload lebih dari 1 file

#### Tabel Daftar Dokumen:

| No | Jenis Dokumen | Nama File | Aksi |
|---|---|---|---|
| 1 | Surat Keputusan ... | SK_kegiatan.pdf | 🗑 Hapus |
| 2 | Surat Tugas ... | ST_kepanitian.pdf | 🗑 Hapus |

**Navigasi:** `[← Sebelumnya]` `[Selanjutnya →]`

> **Catatan:** Dokumen Pendukung bersifat opsional di tahap ini — PUMK bisa skip dan upload nanti.

---

### TAHAP 4 — Rincian Biaya

Tahap ini menampilkan **daftar item anggaran** dari DJA yang terkait dengan Kegiatan yang dipilih di Tahap 1. Dikelompokkan per **kode akun belanja**.

#### Struktur Tampilan per Akun:

```
[Kode Akun] - [Nama Akun] - [Pagu Akun: Rp xxx]
┌────────────────────────────────────────────────────────────────────────┐
│ Uraian │ Vol │ Sat │ Jml Anggaran │ Terpakai │ Sisa │ Jml Permintaan │ Aksi │
└────────────────────────────────────────────────────────────────────────┘
Total: Rp xxx
```

#### Penjelasan Kolom:

| Kolom | Sumber | Keterangan |
|---|---|---|
| Uraian | `dja_rincian_biaya.nama_item` | Nama item belanja dari DJA |
| Volume | Input PUMK | Default 0 |
| Satuan | `dja_rincian_biaya.satuan` | OH, OJ, OK, OB, KEG, dll |
| Jumlah Anggaran | `dja_rincian_biaya.harga_satuan` | Harga satuan dari DJA |
| Terpakai | Hitung dari permohonan lain yg sudah disetujui | Sum permintaan approved lain |
| Sisa Anggaran | `Jumlah Anggaran - Terpakai` | Auto-hitung |
| Jumlah Permintaan | Input PUMK | Volume × Harga Satuan |
| Aksi | Checkbox / toggle | Aktifkan/nonaktifkan item ini |

#### Contoh Data dari DJA (Kegiatan 051-A — Monitoring, Evaluasi, Penataan Legalitas PTS):

**521213 — Belanja Honor Output Kegiatan — [Rp 6.707.000]**

| Uraian | Sat | Harga Satuan |
|---|---|---|
| Honorarium Ketua/Wakil Ketua Panitia Seminar/Rakor/FGD | OK | Rp 400.000 |
| Honorarium Anggota Panitia Seminar/Rakor/FGD | OK | Rp 300.000 |
| Honorarium Sekretaris Panitia Seminar/Rakor/FGD | OK | Rp 300.000 |
| Honorarium Penanggung Jawab Panitia Seminar/Rakor/FGD | OK | Rp 450.000 |

**522151 — Belanja Jasa Profesi — [Rp 1.124.000]**

| Uraian | Sat | Harga Satuan |
|---|---|---|
| Honorarium Narasumber (Pejabat Eselon II) | OJ | Rp 1.000.000 |
| Honorarium Moderator | ORKAL | Rp 700.000 |

**524111 — Belanja Perjalanan Dinas Biasa**

| Uraian | Sat | Harga Satuan |
|---|---|---|
| Uang Harian Perjalanan Dinas Luar Kota (Jawa Barat) | OH | Rp 430.000 |
| Biaya Transportasi Jakarta - Bekasi | OK | Rp 284.000 |
| Biaya Penginapan Luar Kota | OH | Rp 375.000 |

**524113 — Belanja Perjalanan Dinas Dalam Kota**

| Uraian | Sat | Harga Satuan |
|---|---|---|
| Uang Harian Dalam Kota > 8 Jam (DKI Jakarta) | OH | Rp 210.000 |
| Uang Transport Dalam Kota (PP) | OK | Rp 170.000 |

#### Logika Jumlah Permintaan:
```
Jumlah Permintaan = Volume (input PUMK) × Harga Satuan
Sisa Anggaran = Pagu Kegiatan - Total Terpakai semua permohonan approved
```

> [!WARNING]
> Jika **Jumlah Permintaan > Sisa Anggaran**, tampilkan warning merah. PUMK tetap bisa submit tapi ada notifikasi.

**Navigasi Akhir:** `[← Sebelumnya]` `[🚀 Ajukan Permohonan]`

- Klik **Ajukan Permohonan** → konfirmasi dialog → update `status = 'submitted'` → notifikasi ke KA.TIM

---

## BAGIAN 3 — DATABASE TAMBAHAN

### 3.1 Tabel Master Hierarki DJA

```
dja_program (id, tahun_anggaran, kode, nama, pagu, is_aktif)
  └─ dja_sasaran (id, program_id, kode, nama, pagu, is_aktif)
       └─ dja_kro (id, sasaran_id, kode, nama, pagu, is_aktif)
            └─ dja_ro (id, kro_id, kode, nama, volume, satuan, pagu, is_aktif)
                 └─ dja_komponen (id, ro_id, kode, nama, jenis, pagu, is_aktif)
                      └─ dja_kegiatan (id, komponen_id, kode, nama, pagu, is_aktif)
```

### 3.2 Tabel Rincian Biaya per Kegiatan

```
dja_rincian_biaya
  id               bigint PK
  kegiatan_id      FK → dja_kegiatan
  kode_akun        varchar(10)   -- '521213', '522151', '524113'
  nama_akun        varchar(100)  -- 'Belanja Honor Output Kegiatan'
  nama_item        varchar(300)  -- uraian item belanja
  volume_default   decimal(10,2) -- volume default dari DJA
  satuan           varchar(20)   -- 'OH', 'OJ', 'OK', 'OB', 'KEG'
  harga_satuan     decimal(15,2) -- harga dari DJA
  pagu_total       decimal(18,0) -- total pagu item ini
  urutan           int           -- urutan tampil
  is_aktif         boolean
  timestamps
```

### 3.3 Tabel Item Permohonan (existing + update)

```
permohonan_dana_item (existing → update)
  + dja_rincian_biaya_id  FK → dja_rincian_biaya (nullable)
  + volume_diminta        decimal(10,2)
  + jumlah_permintaan     decimal(15,2)  -- volume × harga_satuan
```

### 3.4 Tabel Dokumen Pendukung (baru)

```
permohonan_dana_dokumen
  id                    bigint PK
  permohonan_dana_id    FK → permohonan_dana
  jenis_dokumen_id      tinyint   -- 1-8 (lihat daftar jenis)
  nama_jenis            varchar(100)
  nama_file             varchar(255)
  path_file             varchar(500)
  ukuran_file           int       -- bytes
  timestamps
```

### 3.5 Kolom Tambahan di `permohonan_dana`

```sql
dja_program_id              FK → dja_program
dja_sasaran_id              FK → dja_sasaran
dja_kro_id                  FK → dja_kro
dja_ro_id                   FK → dja_ro
dja_komponen_id             FK → dja_komponen
dja_kegiatan_id             FK → dja_kegiatan
judul_pekerjaan             string
jam_pelaksanaan             time (nullable)
kapokja_id                  FK → users (nullable)
tgl_pertanggungjawaban      date (nullable)
wizard_step                 tinyint default 1  -- step wizard terakhir yg diselesaikan
```

---

## BAGIAN 4 — MASTER DATA DJA UNTUK SUPER ADMIN

```
Super Admin → Keuangan → Master Anggaran DJA
  ├── Kelola Program     (CRUD + aktif/nonaktif + import Excel)
  ├── Kelola Sasaran
  ├── Kelola KRO
  ├── Kelola RO
  ├── Kelola Komponen
  ├── Kelola Kegiatan    (edit pagu)
  └── Kelola Rincian Biaya per Kegiatan
            (edit harga satuan, pagu, aktif/nonaktif)
```

**Import Excel DJA:** Upload `.xlsx` → parse otomatis → preview → simpan ke semua tabel `dja_*`.

---

## BAGIAN 5 — FORMAT NO. PERMOHONAN

```
Format: {SEQ}/{UNIT}/{KODE}/{BULAN-ROMAWI}/{TAHUN}
Contoh: 003/LL3/PerD/IV/2026

SEQ           = nomor urut 3 digit, reset tiap tahun
LL3           = kode LLDIKTI 3
PerD          = kode jenis permohonan dana
IV            = bulan romawi (April = IV)
2026          = tahun anggaran
```

---

## BAGIAN 6 — RENCANA IMPLEMENTASI

```
Fase 1 — Database & Seeder
  [ ] Migration: dja_program, dja_sasaran, dja_kro, dja_ro, dja_komponen, dja_kegiatan
  [ ] Migration: dja_rincian_biaya
  [ ] Migration: permohonan_dana_dokumen
  [ ] Migration: tambah kolom di permohonan_dana & permohonan_dana_item
  [ ] Seeder dari data DJA TA 2026

Fase 2 — Backend
  [ ] DjaController: cascading dropdown endpoints
  [ ] Update Pumk\PermohonanDanaController:
        store (form awal → draft)
        updateStep2 (waktu & PJ)
        updateStep3 (upload dokumen)
        updateStep4 (rincian biaya)
        submit (draft → submitted)
  [ ] Endpoint: sisa anggaran per item (aggregate approved)
  [ ] SuperAdmin\DjaController: CRUD master DJA + import Excel

Fase 3 — Frontend
  [ ] Form.tsx (form awal simpan draft)
  [ ] Wizard.tsx (4-step wrapper)
        Step1Review.tsx (read-only review)
        Step2WaktuPJ.tsx (form waktu & PJ)
        Step3Dokumen.tsx (upload dokumen)
        Step4RincianBiaya.tsx (tabel input biaya)
  [ ] SuperAdmin: halaman Master Anggaran DJA

Fase 4 — QA
  [ ] Validasi semua step
  [ ] Warning jika permintaan > sisa anggaran
  [ ] Test flow: draft → wizard 4 step → ajukan → approval KA.TIM
```
