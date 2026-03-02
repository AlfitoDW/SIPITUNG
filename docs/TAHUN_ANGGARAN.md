# Fitur: Tahun Anggaran

Dokumentasi fitur pemilihan dan pengelolaan tahun anggaran pada sistem SIPITUNG LLDIKTI Wilayah III.

---

## Deskripsi Fitur

Fitur tahun anggaran memungkinkan pengguna memilih tahun anggaran aktif saat login. Seluruh sesi kerja pengguna terikat pada tahun anggaran yang dipilih. Super Admin dapat mengelola daftar tahun anggaran melalui halaman Data Master.

---

## Alur Sistem

```
User buka /login
  → Pilih Tahun Anggaran dari dropdown (hanya yang is_active = true)
  → Isi username + password → klik Masuk
  → Fortify memvalidasi kredensial
  → tahun_anggaran_id disimpan ke session
  → Badge tahun anggaran tampil di header selama sesi aktif
```

---

## Komponen yang Dibangun

### 1. Database

**Tabel:** `tahun_anggaran`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | bigIncrements | Primary key |
| `tahun` | year, unique | Tahun anggaran (misal: 2026) |
| `label` | string | Label tampilan (misal: "TA 2026") |
| `is_active` | boolean | Bisa dipilih saat login |
| `is_default` | boolean | Pre-selected di halaman login |
| `timestamps` | — | created_at, updated_at |

**Seeder:** `TahunAnggaranSeeder` — mengisi data awal tahun 2024, 2025, 2026 (2026 sebagai default).

---

### 2. Model

**File:** `app/Models/TahunAnggaran.php`

- `$fillable`: `tahun`, `label`, `is_active`, `is_default`
- Cast `is_active` dan `is_default` ke `boolean`
- Scope `active()`: filter `where('is_active', true)`
- Scope `default()`: filter `where('is_default', true)`

---

### 3. Autentikasi (Fortify)

**File:** `app/Providers/FortifyServiceProvider.php`

- Login view menerima props `tahunAnggaranList` dan `defaultTahunAnggaranId` dari DB
- Setelah login berhasil, `tahun_anggaran_id` disimpan ke session:
  ```php
  $request->session()->put('tahun_anggaran_id', $request->tahun_anggaran_id);
  ```

---

### 4. Shared Data (Inertia)

**File:** `app/Http/Middleware/HandleInertiaRequests.php`

Data tahun anggaran aktif disebarkan ke semua halaman via Inertia shared props:
```php
'tahun_anggaran' => fn () => session('tahun_anggaran_id')
    ? TahunAnggaran::find(session('tahun_anggaran_id'), ['id', 'tahun', 'label'])
    : null,
```

**TypeScript type** (`resources/js/types/index.ts`):
```ts
tahun_anggaran: { id: number; tahun: number; label: string } | null;
```

---

### 5. Halaman Login

**File:** `resources/js/pages/auth/login.tsx`

- Dropdown pilih tahun anggaran menggunakan shadcn `<Select>`
- Pre-selected berdasarkan `defaultTahunAnggaranId`
- Nilai dikirim via hidden input `tahun_anggaran_id`
- State dikelola dengan `useState`

---

### 6. Badge Tahun Anggaran di Header

**File:** `resources/js/components/app-sidebar-header.tsx`

- Badge tampil di sisi kanan header selama pengguna login
- Menampilkan `label` tahun anggaran aktif (misal: "TA 2026")
- Menggunakan shadcn `<Badge variant="outline">`
- Hanya tampil jika `tahun_anggaran` tidak null

---

### 7. Manajemen Tahun Anggaran (Super Admin)

**Lokasi UI:** Data Master → Tab Tahun

**Controller:** `app/Http/Controllers/SuperAdmin/TahunAnggaranController.php`

| Method | Route | Fungsi |
|--------|-------|--------|
| `store` | `POST /super-admin/data-master/tahun-anggaran` | Tambah tahun anggaran |
| `update` | `PUT /super-admin/data-master/tahun-anggaran/{id}` | Edit tahun anggaran |
| `destroy` | `DELETE /super-admin/data-master/tahun-anggaran/{id}` | Hapus tahun anggaran |
| `toggleDefault` | `PATCH /super-admin/data-master/tahun-anggaran/{id}/toggle-default` | Set sebagai default |

**Tampilan tabel:**

| Kolom | Keterangan |
|-------|------------|
| Tahun | Angka tahun |
| Label | Label tampilan |
| Default | Badge biru (default) / outline (bukan default) |
| Status | Badge hijau (Aktif) / merah (Nonaktif) |
| Aksi | Edit, Set as Default, Hapus |

---

## File yang Diubah / Dibuat

| File | Status |
|------|--------|
| `database/migrations/*_create_tahun_anggaran_table.php` | Dibuat |
| `database/seeders/TahunAnggaranSeeder.php` | Dibuat |
| `database/seeders/DatabaseSeeder.php` | Diubah |
| `app/Models/TahunAnggaran.php` | Dibuat |
| `app/Providers/FortifyServiceProvider.php` | Diubah |
| `app/Http/Middleware/HandleInertiaRequests.php` | Diubah |
| `app/Http/Controllers/SuperAdmin/TahunAnggaranController.php` | Dibuat |
| `app/Http/Controllers/SuperAdmin/DataMasterController.php` | Diubah |
| `routes/roles/super-admin.php` | Diubah |
| `resources/js/pages/auth/login.tsx` | Diubah |
| `resources/js/pages/SuperAdmin/DataMaster/tabs/TahunAnggaranTab.tsx` | Diubah |
| `resources/js/pages/SuperAdmin/DataMaster/types.ts` | Diubah |
| `resources/js/components/app-sidebar-header.tsx` | Diubah |
| `resources/js/types/index.ts` | Diubah |

---

## Catatan

- **Session key:** `tahun_anggaran_id`
- **Inertia shared prop:** `tahun_anggaran`
- **Phase 8 (filter data):** Belum diimplementasi — akan dikerjakan setelah tabel-tabel dokumen/anggaran memiliki kolom `tahun_anggaran_id`
