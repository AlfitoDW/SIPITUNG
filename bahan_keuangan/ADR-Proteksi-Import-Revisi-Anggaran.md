# ADR: Proteksi Import Revisi Anggaran (DJA)

## Status
DRAFT — menunggu approval

## Context

Super Admin dapat mengimport ulang file Excel anggaran (DJA) untuk tahun anggaran tertentu. Proses import saat ini menggunakan `updateOrCreate` per level hierarki (Program -> Sasaran -> KRO -> RO -> Komponen -> Kegiatan -> Rincian Biaya), namun **tidak memiliki proteksi** terhadap skenario berikut:

1. **Pagu rincian biaya turun** di bawah jumlah yang sudah `terpakai` oleh permohonan dana non-draft.
2. **Item hilang dari file revisi** tidak di-nonaktifkan, menyebabkan item "zombie" tetap muncul di dropdown PUMK.
3. **Cache `terpakai` tidak di-invalidate** setelah import, menyebabkan data sisa anggaran sementara tidak akurat.

Revisi anggaran adalah **kejadian biasa** dalam siklus anggaran instansi pemerintah (Perubahan APBN/APBD, revisi DIPA, dll).

## Goals

1. **Zero negative sisa anggaran** — `pagu_total` baru tidak boleh lebih kecil dari `terpakai` aktual untuk rincian yang sudah dipakai.
2. **Arsip aman** — record lama tidak dihapus secara fisik (`hard delete`). Yang hilang dari file revisi hanya di-nonaktifkan (`is_aktif = false`).
3. **Transparansi** — Super Admin mendapatkan **summary report** lengkap apa yang berubah, ditolak, atau di-nonaktifkan.
4. **Cache konsisten** — cache `terpakai` di-invalidate untuk semua rincian yang terdampak.

## Non-Goals

- Audit trail perubahan anggaran (deferred ke fitur audit trail global)
- Notifikasi real-time ke PUMK yang punya draft (bisa ditambahkan di iterasi berikutnya)
- Rollback mekanisme otomatis (out of scope)

---

## Decision: Multi-Layer Protection + Sync Report

### Layer 1 — Pre-Import Validation (Hard Guard)

Sebelum menyentuh database, lakukan **dry-run** untuk memvalidasi setiap rincian biaya di file Excel:

| Kondisi | Aksi |
|---|---|
| `pagu_total_baru >= terpakai_aktual` | Boleh update |
| `pagu_total_baru < terpakai_aktual` | Import ditolak, laporkan item bermasalah |
| Rincian tidak ada di file, tapi tidak punya permohonan aktif | Di-nonaktifkan (`is_aktif = false`) |
| Rincian tidak ada di file, tapi punya permohonan aktif | Tetap aktif, masuk ke warning list |

**`terpakai_aktual`** = `SUM(jumlah_permintaan)` dari `permohonan_dana_item` yang terhubung ke `permohonan_dana` dengan `status NOT IN ('draft', 'rejected')`.

### Layer 2 — Transaction + Soft-Delete

Seluruh import dibungkus dalam **single database transaction**:

```php
DB::transaction(function () {
    // 1. Collect semua ID rincian yang ada di file
    // 2. Nonaktifkan rincian lama yang tidak ada di file & tidak punya permohonan aktif
    // 3. Upsert rincian dari file
    // 4. Invalidate cache untuk semua rincian yang berubah
});
```

**Alasan transaction:** Jika ada error di tengah proses (misal validasi gagal di baris ke-500), seluruh perubahan di-rollback. Tidak ada database dalam keadaan setengah jadi.

### Layer 3 — Cache Invalidation

Setelah transaction berhasil, invalidate cache key `dja_rincian_{id}_terpakai` untuk:
- Semua rincian yang `pagu_total`-nya berubah
- Semua rincian yang di-nonaktifkan
- Semua rincian yang aktif kembali setelah sebelumnya nonaktif

### Layer 4 — Summary Report

Tampilkan di flash message / modal hasil import:

```
✅ Import Berhasil — 1.247 baris diproses

Detail:
• 45 rincian biaya di-update
• 12 rincian baru ditambahkan
• 8 rincian di-nonaktifkan (tidak ada di file)
• 3 rincian tetap aktif karena masih punya permohonan dana

⚠️ Warning:
• Item [521211] Honor Penyusunan LK -> pagu turun dari 50jt ke 45jt,
  tapi masih aman (terpakai 30jt)
• 2 item tidak diubah karena terpakai melebihi pagu baru
```

---

## Data Model Changes

### 1. Tambah kolom `import_version` (opsional, untuk tracking)

Tidak wajib untuk iterasi ini, tapi direkomendasikan untuk debugging:

```php
// migration
$table->unsignedInteger('import_version')->default(1)->after('is_aktif');
```

Setiap kali import revisi, increment version. Memudahkan trace "ini data dari import batch ke berapa."

### 2. Pastikan semua tabel DJA punya `is_aktif`

Cek: Program, Sasaran, KRO, RO, Komponen, Kegiatan, RincianBiaya — semua sudah punya `is_aktif`. ✅

---

## Algorithm Detail (Dry-Run + Real Run)

### Step A — Parse & Build Tree dari Excel

Sama seperti sekarang, tapi simpan ke array in-memory dulu (jangan langsung DB).

### Step B — Collect Existing Rincian untuk Tahun Ini

```php
$existingRincians = DjaRincianBiaya::whereHas(
    'kegiatan.komponen.ro.kro.sasaran.program',
    fn ($q) => $q->where('tahun_anggaran', $tahun)
)->get()->keyBy(
    fn ($r) => $r->kegiatan_id . '|' . $r->nama_item
);
```

### Step C — Dry-Run Validation

```php
$violations = [];
$toUpdate = [];
$toDisable = [];
$toKeepActive = [];

foreach ($parsedItems as $item) {
    $existing = $existingRincians->get($item->uniqueKey);

    if ($existing) {
        $terpakai = $existing->terpakai;
        if ($item->pagu_total < $terpakai) {
            $violations[] = [
                'item' => $existing,
                'terpakai' => $terpakai,
                'pagu_baru' => $item->pagu_total,
                'selisih' => $terpakai - $item->pagu_total,
            ];
        } else {
            $toUpdate[] = ['existing' => $existing, 'new' => $item];
        }
    } else {
        $toUpdate[] = ['existing' => null, 'new' => $item];
    }
}

// Item yang ada di DB tapi tidak ada di file
foreach ($existingRincians as $existing) {
    if (! $parsedItems->has($existing->uniqueKey)) {
        $hasActive = PermohonanDanaItem::where('dja_rincian_biaya_id', $existing->id)
            ->whereHas('permohonanDana', fn ($q) => $q->whereNotIn('status', ['draft', 'rejected']))
            ->exists();

        if ($hasActive) {
            $toKeepActive[] = $existing;
        } else {
            $toDisable[] = $existing;
        }
    }
}
```

### Step D — Decision

```php
if ($violations->isNotEmpty()) {
    return back()->with('error', 'Import dibatalkan. ' . $violations->count() . ' item pagu turun di bawah terpakai.');
}
```

### Step E — Execute dalam Transaction

```php
DB::transaction(function () use ($toUpdate, $toDisable, $tahun) {
    // 1. Nonaktifkan item yang tidak ada di file
    foreach ($toDisable as $item) {
        $item->update(['is_aktif' => false]);
    }

    // 2. Upsert item dari file
    foreach ($toUpdate as $pair) {
        if ($pair['existing']) {
            $pair['existing']->update([
                'kode_akun' => $pair['new']->kode_akun,
                'nama_akun' => $pair['new']->nama_akun,
                'nama_item' => $pair['new']->nama_item,
                'satuan' => $pair['new']->satuan,
                'harga_satuan' => $pair['new']->harga_satuan,
                'pagu_total' => $pair['new']->pagu_total,
                'urutan' => $pair['new']->urutan,
                'is_aktif' => true,
            ]);
        } else {
            DjaRincianBiaya::create([...$pair['new']->toArray(), 'is_aktif' => true]);
        }
    }
});
```

### Step F — Invalidate Cache

```php
$changedIds = collect($toUpdate)->pluck('existing.id')
    ->merge($toDisable->pluck('id'))
    ->filter();

foreach ($changedIds as $id) {
    cache()->forget("dja_rincian_{$id}_terpakai");
}
```

---

## File Changes

| File | Change |
|---|---|
| `app/Http/Controllers/SuperAdmin/DjaController.php` | Refactor `importExcel()` — dry-run + transaction + summary report |
| `app/Models/DjaRincianBiaya.php` | Tambah method `hasActivePermohonan()` untuk cek cepat |
| `app/Models/PermohonanDana.php` | (Opsional) Tambah scope untuk cek rincian terpakai |
| `database/migrations/` | (Opsional) Tambah `import_version` |
| Tests | Tambah test: import revisi turun pagu, import nonaktifkan item, import cache invalidate |

---

## Testing Plan

1. **Test: Pagu turun di bawah terpakai**
   - Buat rincian biaya pagu 10jt
   - Buat permohonan approved pakai 7jt
   - Import file revisi: pagu rincian jadi 5jt
   - **Expected:** Import ditolak, error message jelas

2. **Test: Item hilang dari file, tidak punya permohonan**
   - Rincian A ada di DB, tidak ada di file, tidak punya permohonan
   - Import file tanpa Rincian A
   - **Expected:** `is_aktif = false`, tetap ada di DB

3. **Test: Item hilang dari file, punya permohonan aktif**
   - Rincian B ada di DB, tidak ada di file, punya permohonan approved
   - Import file tanpa Rincian B
   - **Expected:** `is_aktif` tetap `true`, masuk warning list

4. **Test: Cache invalidate**
   - Sebelum import: cache `terpakai` = 7jt
   - Import revisi: pagu naik jadi 20jt
   - Setelah import: cache ter-refresh, `sisa_anggaran` akurat

---

## Rollout / Migration

Tidak ada breaking change. Fitur ini purely additive:

- Schema: `is_aktif` sudah ada di semua tabel DJA
- Logic: import yang sudah berjalan tidak berubah secara drastis, hanya ditambah guard
- Data: tidak ada migrasi data yang berisiko

---

## Conclusion

Implementasikan **Layer 1–4** di atas. Prioritas:

1. **P0** — Dry-run validation (block import kalau akan minus)
2. **P0** — Transaction wrapper
3. **P1** — Soft-disable item yang tidak ada di file
4. **P1** — Cache invalidation
5. **P2** — Summary report UI
6. **P2** — `import_version` tracking (nice-to-have)
