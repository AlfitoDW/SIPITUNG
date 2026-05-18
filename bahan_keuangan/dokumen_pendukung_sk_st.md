# Prompt — Tambahkan Input SK/ST ke Fitur Upload Dokumen yang Sudah Ada

## KONTEKS

Stack: **Laravel 12 + React 19 + Inertia.js + shadcn/ui (New York) + Tailwind CSS 4**
Project: `/Users/inyongscoobydoo/Documents/SDLC/lldikti3/sisteminformasilldikti3`

### Yang Sudah Ada & Bekerja

1. **Model `PermohonanDana`** sudah punya kolom `no_sk`, `tgl_sk`, `no_st`, `tgl_st` di `$fillable` dan `$casts`
2. **Model `PermohonanDanaDokumen`** sudah ada dengan `$JENIS` array (1-8), relasi ke `PermohonanDana`
3. **Controller `Pumk\PermohonanDanaController`**:
   - `uploadDokumen()` — sudah bisa upload file, tapi **BELUM** menangani input SK/ST
   - `hapusDokumen()` — sudah bisa hapus file, tapi **BELUM** nullify SK/ST
   - `wizard()` — sudah kirim props `jenisDokumen` dan `pd.dokumens`
4. **Frontend `Wizard.tsx` → `Step3`** — sudah ada form upload (dropdown jenis + file picker), tabel dokumen, preview modal — tapi **BELUM** ada field input No. SK/Tanggal SK dan No. ST/Tanggal ST

### Yang BELUM Ada (Target Implementasi)

Saat PUMK memilih jenis dokumen **"Surat Keputusan Pelaksanaan Kegiatan" (jenis 2)** atau **"Surat Tugas Kepanitiaan" (jenis 3)**, harus muncul **field tambahan** untuk input nomor dan tanggal surat. Data ini disimpan ke tabel `permohonan_dana` dan dipakai nanti di header Excel export Daftar Nominatif.

---

## PERUBAHAN YANG DIBUTUHKAN

### 1. Backend — `Pumk\PermohonanDanaController::uploadDokumen()`

File: `app/Http/Controllers/Pumk/PermohonanDanaController.php` (line ~258)

**Tambahkan:**
- Validasi kondisional: jika `jenis_dokumen_id == 2`, wajibkan `no_sk` (string, max:100) dan `tgl_sk` (date). Jika `jenis_dokumen_id == 3`, wajibkan `no_st` (string, max:100) dan `tgl_st` (date)
- Setelah insert `PermohonanDanaDokumen`, update kolom SK/ST di `permohonan_dana`:
  ```php
  if ($jenis === 2) {
      $pd->update([
          'no_sk' => $request->no_sk,
          'tgl_sk' => $request->tgl_sk,
      ]);
  } elseif ($jenis === 3) {
      $pd->update([
          'no_st' => $request->no_st,
          'tgl_st' => $request->tgl_st,
      ]);
  }
  ```

### 2. Backend — `Pumk\PermohonanDanaController::hapusDokumen()`

File: `app/Http/Controllers/Pumk/PermohonanDanaController.php` (line ~286)

**Tambahkan:** Setelah hapus dokumen, jika jenis dokumen yang dihapus adalah 2 atau 3, nullify kolom SK/ST:
```php
if ($dokumen->jenis_dokumen_id === 2) {
    $pd->update(['no_sk' => null, 'tgl_sk' => null]);
} elseif ($dokumen->jenis_dokumen_id === 3) {
    $pd->update(['no_st' => null, 'tgl_st' => null]);
}
```

### 3. Backend — `Pumk\PermohonanDanaController::wizard()`

File: `app/Http/Controllers/Pumk/PermohonanDanaController.php` (line ~223)

**Tambahkan** di Inertia props agar frontend bisa menampilkan data SK/ST yang sudah tersimpan:
```php
return Inertia::render('Pumk/PermohonanDana/Wizard', [
    // ... props yang sudah ada ...
    'no_sk' => $pd->no_sk,
    'tgl_sk' => $pd->tgl_sk?->format('Y-m-d'),
    'no_st' => $pd->no_st,
    'tgl_st' => $pd->tgl_st?->format('Y-m-d'),
]);
```

### 4. Frontend — `Wizard.tsx` interface `Props`

File: `resources/js/pages/Pumk/PermohonanDana/Wizard.tsx`

**Tambahkan** ke interface `Props`:
```typescript
no_sk?: string | null;
tgl_sk?: string | null;
no_st?: string | null;
tgl_st?: string | null;
```

**Tambahkan** ke interface `Pd` (karena data SK/ST sudah ada di `pd` melalui model):
```typescript
no_sk?: string | null;
tgl_sk?: string | null;
no_st?: string | null;
tgl_st?: string | null;
```

### 5. Frontend — `Step3` component

File: `resources/js/pages/Pumk/PermohonanDana/Wizard.tsx` (line ~385)

**Modifikasi form upload** di dalam `Step3` — tambahkan state dan field kondisional:

#### 5a. Tambah state:
```typescript
const [noSk, setNoSk] = useState(pd.no_sk ?? '');
const [tglSk, setTglSk] = useState(pd.tgl_sk ?? '');
const [noSt, setNoSt] = useState(pd.no_st ?? '');
const [tglSt, setTglSt] = useState(pd.tgl_st ?? '');
```

#### 5b. Update fungsi `upload()`:

Tambahkan data SK/ST ke FormData sebelum kirim:
```typescript
const upload = () => {
    if (!jenis || !fileRef.current?.files?.[0]) return;
    // Validasi tambahan untuk SK/ST
    if (jenis === '2' && (!noSk || !tglSk)) return;
    if (jenis === '3' && (!noSt || !tglSt)) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('jenis_dokumen_id', jenis);
    formData.append('file', fileRef.current.files[0]);
    // Kirim data SK/ST jika relevan
    if (jenis === '2') {
        formData.append('no_sk', noSk);
        formData.append('tgl_sk', tglSk);
    }
    if (jenis === '3') {
        formData.append('no_st', noSt);
        formData.append('tgl_st', tglSt);
    }
    // ... router.post sama seperti existing ...
};
```

#### 5c. Tambah field kondisional di JSX:

Letakkan **setelah** dropdown "Pilih Jenis Dokumen" dan **sebelum** file picker. Tampilkan hanya saat jenis tertentu dipilih:

```
┌── Upload Area (existing dashed border) ──────────────────────────┐
│                                                                   │
│  [Pilih Jenis Dokumen ▼]          [Pilih File 📁]               │
│                                                                   │
│  ── Muncul jika pilih jenis 2 (SK) ──────────────────────────── │
│  │ Nomor Surat Keputusan:  [___________________]   (wajib)      │
│  │ Tanggal SK:              [__ / __ / ____]        (wajib)      │
│                                                                   │
│  ── Muncul jika pilih jenis 3 (ST) ──────────────────────────── │
│  │ Nomor Surat Tugas:      [___________________]   (wajib)      │
│  │ Tanggal ST:              [__ / __ / ____]        (wajib)      │
│                                                                   │
│                              [ ⬆️ Upload Dokumen ]               │
└───────────────────────────────────────────────────────────────────┘
```

Gunakan komponen shadcn yang sudah dipakai (`Input`, `Label`, `DateInput`).

#### 5d. Tambah info badge SK/ST di bawah tabel dokumen:

Setelah tabel daftar dokumen dan sebelum tombol navigasi, tampilkan info SK/ST yang sudah tersimpan:

```tsx
{/* Info SK/ST yang tersimpan */}
{(pd.no_sk || pd.no_st) && (
    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-1.5">
        <p className="text-xs font-semibold text-blue-700">Referensi Surat</p>
        {pd.no_sk && (
            <p className="text-xs text-blue-600">
                📄 Surat Keputusan: <span className="font-medium">{pd.no_sk}</span>
                {pd.tgl_sk && <> — Tanggal: {new Date(pd.tgl_sk).toLocaleDateString('id-ID')}</>}
            </p>
        )}
        {pd.no_st && (
            <p className="text-xs text-blue-600">
                📄 Surat Tugas: <span className="font-medium">{pd.no_st}</span>
                {pd.tgl_st && <> — Tanggal: {new Date(pd.tgl_st).toLocaleDateString('id-ID')}</>}
            </p>
        )}
    </div>
)}
```

---

## KONTEKS BISNIS — Mengapa SK & ST Penting

Data SK/ST dipakai saat **Bendahara export Excel Daftar Nominatif**:

**Sheet Honorarium** (kode akun 521115, 521213, 522151) → header:
```
Lampiran :
Surat Keputusan Kepala LLDIKTI Wilayah III selaku KPA
Nomor : {no_sk} Tanggal {tgl_sk}
```

**Sheet Perjalanan Dinas** (kode akun 524111, 524119, 524113) → header:
```
Lampiran :
Surat Keputusan Kepala LLDIKTI Wilayah III selaku KPA
Nomor : {no_st} Tanggal {tgl_st}
```

Jika SK/ST belum diisi, header di Excel akan menampilkan string kosong (jangan error).

---

## FILE YANG PERLU DIUBAH

| File | Perubahan |
|---|---|
| `app/Http/Controllers/Pumk/PermohonanDanaController.php` | `uploadDokumen()`: validasi + simpan SK/ST. `hapusDokumen()`: nullify SK/ST. `wizard()`: kirim props SK/ST |
| `resources/js/pages/Pumk/PermohonanDana/Wizard.tsx` | `Step3`: tambah state, field kondisional, update upload(), info badge |

**JANGAN** ubah file lain kecuali yang di atas. Semua perubahan adalah **penambahan** ke kode yang sudah ada, bukan penulisan ulang.

---

## CATATAN

1. Kolom `no_sk`, `tgl_sk`, `no_st`, `tgl_st` di tabel `permohonan_dana` **sudah ada** — tidak perlu migration baru
2. Model `PermohonanDana` sudah punya kolom ini di `$fillable` dan `$casts` — tidak perlu update model
3. Jangan ubah logika upload yang sudah ada — hanya **tambahkan** handling SK/ST
4. Saat readonly (bukan draft/rejected), field SK/ST ikut tersembunyi bersama form upload
5. Field SK/ST wajib diisi **hanya saat** upload dokumen jenis 2 atau 3 — bukan saat submit permohonan
