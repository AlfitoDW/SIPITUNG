# Revisi Anggaran — Desain & Implementasi

> **Tanggal:** 2026-06-08
> **Branch:** `modulkeuangan`
> **Scope:** Modul Keuangan — Impor & Revisi Master Anggaran DJA

---

## 1. Problem Statement

Pada tahun anggaran 2026, setelah impor anggaran pertama ke sistem dan pembuatan permohonan dana (yang mengurangi sisa pagu), perusahaan dapat melakukan revisi anggaran — yaitu mengimpor ulang data DJA yang dapat:

- Menambah program/sasaran/rincian biaya baru
- Menghapus yang sudah ada
- Mengalokasikan ulang dana (pagu berubah)

**Risiko:** Tanpa mekanisme revisi yang proper, data existing rusak — sisa pagu bisa minus, histori permohonan tidak jelas acuannya, tidak ada audit trail.

---

## 2. Keputusan Desain

| # | Topik | Keputusan |
|---|---|---|
| 1 | Sumber data revisi | Impor bisa file Excel penuh atau parsial (keduanya didukung) |
| 2 | Nasib permohonan existing | Semua permohonan (draft, submitted, approved, dicairkan) **mengunci pagu snapshot** saat dibuat. Revisi **forward-only** — hanya mempengaruhi permohonan baru ke depan |
| 3 | Deteksi revisi | Otomatis: jika tahun anggaran sudah punya data DJA, impor berikutnya dianggap **revisi** |
| 4 | Audit trail | Tabel `dja_revisi` (header) + `dja_revisi_detail` (perubahan per item) |
| 5 | Overbudget | Dihitung real-time di semua UI role + flag di `dja_rincian_biaya.overbudget_flag` + notifikasi ke SuperAdmin & Bendahara |
| 6 | Matching impor vs DB | By kode unik per level (program→sasaran→kro→ro→komponen→kegiatan→rincian_biaya) menggunakan **hash map single-pass** |
| 7 | Penghapusan item | **Hard block** — item tidak boleh dihapus kalau ada permohonan non-draft/non-rejected yang terikat. Parent level atas yang hilang dari Excel dianggap **anomali impor**, tidak otomatis dihapus |
| 8 | Snapshot pagu | Disimpan di `permohonan_dana_item.pagu_rincian_snapshot` |
| 9 | Flow impor | Upload → **pratinjau perubahan** (hierarkis) → konfirmasi user → commit transaksi |
| 10 | Rumus sisa anggaran | `pagu_revisi - total_realisasi_semua = sisa`, realisasi = semua `jumlah_permintaan` dari permohonan approved/dicairkan |
| 11 | Revisi langsung berlaku | Tanpa approval — SuperAdmin konfirmasi → data DJA langsung berubah |
| 12 | Resolusi overbudget | Manual oleh keuangan: naikkan pagu / buka kunci permohonan / realokasi dari item surplus |
| 13 | Backfill data existing | `pagu_rincian_snapshot` diisi dari `dja_rincian_biaya.pagu_total` saat ini (akurat karena belum ada mekanisme revisi sebelumnya) |

---

## 3. Skema Database

### Tabel baru: `dja_revisi`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `tahun_anggaran_id` | FK → tahun_anggaran | restrictOnDelete |
| `nomor_revisi` | int | Auto-increment per tahun anggaran |
| `user_id` | FK → users | SuperAdmin yang melakukan revisi |
| `catatan` | text | Alasan revisi |
| `created_at` | timestamp | |

Unique: `(tahun_anggaran_id, nomor_revisi)`

### Tabel baru: `dja_revisi_detail`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `dja_revisi_id` | FK → dja_revisi | cascadeOnDelete |
| `level` | varchar(30) | program / sasaran / kro / ro / komponen / kegiatan / rincian_biaya |
| `kode_item` | varchar(50) | Kode unik item di level-nya |
| `parent_kode` | varchar(50) | Full path parent |
| `nama_item` | varchar(400) | |
| `jenis_perubahan` | enum | tambah / ubah / hapus / realokasi |
| `pagu_lama` | decimal(15,2) | |
| `pagu_baru` | decimal(15,2) | |
| `status_eksekusi` | varchar(30) | sukses / gagal_hapus_terikat / skip_anomali |
| `keterangan` | text | |

### Kolom baru di tabel existing

| Tabel | Kolom | Tipe |
|---|---|---|
| `dja_rincian_biaya` | `overbudget_flag` | boolean, default false |
| `permohonan_dana_item` | `pagu_rincian_snapshot` | decimal(15,2), nullable |

---

## 4. Method Baru di `DjaRincianBiaya`

```php
getOverbudgetAmountAttribute(): float
// max(0, terpakai - pagu_total)

getStatusAnggaranAttribute(): string
// 'overbudget' | 'habis' | 'tersedia' | 'belum_terpakai'

syncOverbudgetFlag(): void
// Sinkronisasi overbudget_flag ke DB tanpa trigger event

invalidateTerpakaiBatch(array $ids): void
// Hapus cache terpakai untuk banyak rincian sekaligus
```

Method existing **tidak berubah**:
- `getTerpakaiAttribute()` — tetap `sum(jumlah_permintaan)` approved/dicairkan
- `getSisaAnggaranAttribute()` — tetap `max(0, pagu_total - terpakai)`

---

## 5. Alur Impor Revisi

```
┌──────────────┐    ┌────────────────┐    ┌──────────────┐    ┌──────────┐
│ Upload Excel │───▶│ DjaImportService│───▶│ Inertia Page │───▶│  Preview │
│   (xlsx)     │    │   .preview()   │    │  + preview   │    │  Dialog  │
└──────────────┘    │                │    │    props     │    └────┬─────┘
                    │ parse Excel    │    └──────────────┘         │
                    │ build hash map │                             │ konfirmasi
                    │ build DB map   │                             ▼
                    │ diff()         │                    ┌──────────────────┐
                    └────────────────┘                    │ POST /import/    │
                                                          │    confirm       │
                                                          │                  │
                                                          │ DjaImportService │
                                                          │   .commit()      │
                                                          │                  │
                                                          │ • dja_revisi     │
                                                          │ • dja_revisi_    │
                                                          │   detail         │
                                                          │ • updateOrCreate │
                                                          │ • sync overbudget│
                                                          │ • invalidate     │
                                                          │   cache          │
                                                          └──────────────────┘
```

### 6 langkah eksekusi:

1. **Parse Excel** → bangun hash map full-path (`program:kode/sasaran:kode/.../rincian_biaya:kode`)
2. **Build DB map** → iterasi semua DJA aktif dari database, bangun hash map identik
3. **Diff** → bandingkan kedua hash map: key di Excel tapi tidak di DB = `tambah`, key di DB tapi tidak di Excel = `hapus`, key di keduanya dengan pagu/nama berbeda = `ubah`
4. **Validasi hapus** → cek setiap item yang akan dihapus: kalau rincian biaya punya permohonan terikat → status `gagal_hapus_terikat`. Kalau parent level atas punya child dengan permohonan terikat → `gagal_hapus_terikat`
5. **Proyeksi overbudget** → untuk item `ubah` yang pagunya turun di bawah `terpakai` → tandai overbudget
6. **Commit** dalam 1 transaksi DB: simpan `dja_revisi`, simpan semua `dja_revisi_detail`, jalankan `updateOrCreate`/`is_aktif=false`, sinkronisasi `overbudget_flag`, invalidate cache

---

## 6. UI — Dialog Pratinjau Revisi

### Komponen baru di `MasterAnggaran/Index.tsx`

- **`ImportDialog`** — diperbarui: upload file → POST `importExcel` → page reload dengan `importPreview` props → otomatis tampilkan `ImportPreviewDialog`
- **`ImportPreviewDialog`** — dialog full-width dengan:
  - Summary cards (Tambah / Berubah / Dihapus / Diblokir)
  - Banner peringatan overbudget (jumlah item + total nominal)
  - Banner item diblokir (jumlah item yang gagal dihapus)
  - **Tree hierarkis rekursif** (`PreviewTree`) — setiap node menampilkan level, kode, nama, pagu lama→baru, badge jenis perubahan, badge overbudget
  - Input catatan revisi
  - Tombol Konfirmasi & Terapkan
- **`PreviewTree`** — komponen rekursif dengan expand/collapse, color-coded by jenis perubahan:
  - 🟢 Tambah (emerald)
  - 🟠 Ubah (amber)
  - 🔴 Hapus (merah, strikethrough)
  - 🟠 Diblokir (oranye, dengan label alasan)
  - 🔴 Overbudget (badge destructive)

### Komponen diperbarui di `Wizard.tsx`

- Badge **"Overbudget"** (merah) dan **"Habis"** (abu) di samping nama item
- Banner ringkasan overbudget di atas tabel — menampilkan jumlah item + total overbudget
- Baris overbudget diberi background `bg-red-100`, tidak bisa diinput volume

---

## 7. Dampak ke Role Lain

| Role | Dampak |
|---|---|
| **PUMK** | Wizard Step 4: item overbudget ditandai, tidak bisa diajukan. Item dengan `status_anggaran = 'habis'` diberi badge. Banner ringkasan muncul kalau ada item overbudget |
| **Ketua Tim** | Halaman approval: sisa pagu dihitung dari `pagu_revisi - realisasi_semua`. Overbudget tampil merah |
| **Kabag/PPK** | Sama — sisa bisa negatif, perlu perhatian |
| **PIC Keuangan** | Sama |
| **Bendahara** | Sama + akan menerima notifikasi saat revisi menghasilkan overbudget |
| **SuperAdmin** | Melakukan impor revisi via dialog pratinjau. Menerima notifikasi overbudget. Dapat melihat riwayat revisi (future) |

---

## 8. File yang Berubah

### File baru (8)

```
database/migrations/2026_06_08_010854_create_dja_revisi_table.php
database/migrations/2026_06_08_010855_add_overbudget_to_dja_rincian_biaya.php
database/migrations/2026_06_08_010856_add_pagu_rincian_snapshot_to_permohonan_dana_item.php
database/migrations/2026_06_08_010857_create_dja_revisi_detail_table.php
app/Models/DjaRevisi.php
app/Models/DjaRevisiDetail.php
app/Services/DjaImportService.php
app/Console/Commands/BackfillPaguRincianSnapshot.php
```

### File diubah (7)

```
app/Models/DjaRincianBiaya.php              — accessor overbudget_amount, status_anggaran, syncOverbudgetFlag
app/Models/PermohonanDanaItem.php           — fillable/casts: pagu_rincian_snapshot
app/Http/Controllers/SuperAdmin/DjaController.php  — importExcel → preview, +confirmImport
app/Http/Controllers/Pumk/PermohonanDanaController.php — inject pagu_rincian_snapshot + transmit overbudget fields
routes/roles/super-admin.php                — +POST /import/confirm
resources/js/pages/SuperAdmin/Keuangan/MasterAnggaran/Index.tsx — ImportDialog, ImportPreviewDialog, PreviewTree
resources/js/pages/Pumk/PermohonanDana/Wizard.tsx — Badge overbudget/habis + banner
```

---

## 9. Known Caveats

1. **Weak key pada rincian biaya:** matching rincian biaya menggunakan `nama_item` (teks bebas). Kalau revisi mengubah teks, item dianggap baru (bukan update). Ini bisa jadi masalah kalau format Excel tidak konsisten.
2. **Tidak ada paginasi DJA:** Seluruh hierarki DJA diload ke memori untuk satu tahun anggaran — bisa berat untuk data sangat besar.
3. **Revisi langsung berlaku:** Tidak ada workflow approval untuk revisi. Cocok untuk SuperAdmin, tapi kalau nanti ada role lain yang bisa impor, perlu approval flow.

---

## 10. Perintah Tambahan

```bash
# Backfill pagu_rincian_snapshot untuk data permohonan existing
php artisan app:backfill-pagu-rincian-snapshot

# Cek status overbudget di semua rincian biaya
php artisan tinker --execute="
    echo App\Models\DjaRincianBiaya::where('overbudget_flag', true)->count() . ' overbudget items';
"
```
