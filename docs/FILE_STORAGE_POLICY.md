# File Storage Policy

> Keputusan arsitektur: semua file upload sensitif disimpan di disk `local` (private) dan disajikan melalui `FileController` dengan pemeriksaan autentikasi & otorisasi. Tidak ada file user-upload yang diakses langsung via URL publik.

## Disk Configuration

| Disk | Root | Visibility | Usage |
|---|---|---|---|
| `local` | `storage/app/private` | Private | **Semua file upload** (dokumen permohonan, bukti bayar, dll) |
| `public` | `storage/app/public` | Public | Tidak digunakan untuk file upload — hanya untuk static assets jika ada |

**Config:** `config/filesystems.php`

```php
'local' => [
    'driver' => 'local',
    'root' => storage_path('app/private'),
    'serve' => true,
    'throw' => false,
    'report' => false,
],
```

## Upload Pattern

Selalu gunakan disk `local` saat upload:

```php
// ❌ Jangan
$path = $file->store('folder', 'public');

// ✅ Do
$path = $file->store('folder', 'local');
```

## File Access Architecture

```
User ──► FileController ──► Auth Check ──► Storage::disk('local') ──► File
```

### Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `GET /files/bukti-bayar/{pd}` | Download/Preview | Bukti bayar permohonan dana |
| `GET /files/dokumen/{dokumen}` | Download/Preview | Dokumen permohonan dana |

### Query Parameters

| Parameter | Type | Description |
|---|---|---|
| `download` | `boolean` | Force `Content-Disposition: attachment`. Default: auto (inline untuk gambar/PDF, attachment untuk lainnya) |

## Authorization Matrix

| Role | Access Rule |
|---|---|
| `super_admin` | All files |
| `bendahara` | All files |
| `pic_keuangan` | All files |
| `pimpinan` (kabag/ppk) | All files |
| `ketua_tim_kerja` | Files belonging to their `tim_kerja_id` only |
| `pumk` | Files belonging to their own permohonan only (`created_by === user.id`) |

## Inline vs Download Behavior

FileController secara otomatis menentukan `Content-Disposition` berdasarkan MIME type:

| MIME Type | Disposition |
|---|---|
| `image/jpeg`, `image/png`, `image/gif`, `image/webp` | `inline` (browser preview) |
| `application/pdf` | `inline` (browser preview) |
| Lainnya (`doc`, `xlsx`, dll) | `attachment` (force download) |

Tambahkan `?download=1` untuk memaksa attachment pada semua jenis file.

## Frontend Integration

### Sebelum (tidak aman)
```tsx
<a href={`/storage/${dok.path_file}`} target="_blank">
```

### Sesudah (aman)
```tsx
<a href={`/files/dokumen/${dok.id}`} target="_blank">
<a href={`/files/bukti-bayar/${pd.id}`} target="_blank">
```

**Note:** Frontend menggunakan `dok.id` atau `pd.id` (resource ID), bukan `path_file`. Path file internal tidak pernah diekspos ke frontend.

## Penghapusan File

Saat menghapus record yang memiliki file, selalu hapus file dari storage:

```php
if (Storage::disk('local')->exists($record->path_file)) {
    Storage::disk('local')->delete($record->path_file);
}
$record->delete();
```

## Migration Notes

- Symlink `public/storage` telah dihapus. Tidak ada lagi akses publik ke `storage/app/public`.
- File yang sebelumnya tersimpan di `storage/app/public` perlu dipindahkan ke `storage/app/private` (jika ada).
- Path relatif di database (`path_file`, `bukti_bayar_path`) tidak berubah — hanya root disk yang berbeda.

## Future Uploads

Semua fitur baru yang melibatkan upload file **wajib** mengikuti pola ini:
1. Simpan ke disk `local`
2. Simpan path relatif di database
3. Buat endpoint di `FileController` (atau reuse jika model terkait)
4. Frontend akses via `/files/{resource}/{id}`

## Security Rationale

1. **No direct URL access** — file tidak bisa diakses tanpa melalui Laravel
2. **Role-based authorization** — setiap request dicek role & ownership
3. **Path obfuscation** — user tidak pernah melihat path internal file
4. **Audit-ready** — semua akses melewati controller yang bisa di-extend untuk logging di masa depan
