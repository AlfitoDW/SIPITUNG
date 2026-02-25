# Sistem Informasi LLDIKTI 3

Sistem informasi berbasis web untuk pengelolaan dokumen, perencanaan, keuangan, dan pertanggungjawaban LLDIKTI Wilayah III.

**Stack:** Laravel + Inertia.js + React + TypeScript + shadcn/ui

---

## Arsitektur Sidebar per Role

### Latar Belakang

Aplikasi ini memiliki 4 role pengguna dengan hak akses dan menu yang berbeda-beda. Sidebar menampilkan menu yang relevan sesuai role yang sedang login — tanpa perlu membuat komponen sidebar yang berbeda-beda.

### Struktur File

```
resources/js/
├── config/
│   └── navigation/              ← Data menu per role (bukan komponen)
│       ├── super-admin.ts       ← Menu Super Admin
│       ├── ketua-tim.ts         ← Menu Ketua Tim Kerja
│       ├── pimpinan.ts          ← Menu Pimpinan (Kabag Umum & PPK)
│       └── bendahara.ts         ← Menu Bendahara
│
├── components/
│   └── app-sidebar.tsx          ← Role router: pilih nav sesuai role
│
└── types/
    └── auth.ts                  ← Tipe User, UserRole, PimpinanType
```

### Cara Kerja

`app-sidebar.tsx` membaca `auth.user.role` dari Inertia shared data, lalu memilih config navigasi yang sesuai:

```ts
const navByRole: Record<UserRole, NavGroup[]> = {
    super_admin:     superAdminNav,
    ketua_tim_kerja: ketuaTimNav,
    pimpinan:        pimpinanNav,
    bendahara:       bendaharaNav,
};

// Di dalam komponen:
const navGroups = navByRole[auth.user.role] ?? [];
```

Sidebar tetap satu komponen (`AppSidebar`). Yang berubah hanya data navigasinya.

### Menambah/Mengubah Menu

Untuk mengubah menu suatu role, cukup edit file config yang bersangkutan:

| Role | File yang diedit |
|---|---|
| Super Admin | `resources/js/config/navigation/super-admin.ts` |
| Ketua Tim Kerja | `resources/js/config/navigation/ketua-tim.ts` |
| Pimpinan | `resources/js/config/navigation/pimpinan.ts` |
| Bendahara | `resources/js/config/navigation/bendahara.ts` |

Tidak perlu menyentuh `app-sidebar.tsx` sama sekali.

---

## Role & Akses

| Role | Value di DB | Deskripsi |
|---|---|---|
| Super Admin | `super_admin` | Akses penuh ke seluruh fitur dan administrasi |
| Ketua Tim Kerja | `ketua_tim_kerja` | Input perencanaan, permohonan dana, dan LPJ tim sendiri |
| Pimpinan | `pimpinan` | Approval dan validasi dokumen |
| Bendahara | `bendahara` | Pencairan dana dan verifikasi LPJ |

### Sub-tipe Pimpinan

Role `pimpinan` memiliki dua sub-tipe yang disimpan di kolom `pimpinan_type`:

| Nilai | Jabatan |
|---|---|
| `kabag_umum` | Kepala Bagian Umum |
| `ppk` | Pejabat Pembuat Komitmen |

### Struktur Tim Kerja

- Terdapat **11 Tim Kerja**, masing-masing dipimpin satu Ketua Tim Kerja
- User `ketua_tim_kerja` terhubung ke `tim_kerja` via kolom `tim_kerja_id`
- Data perencanaan, keuangan, dan LPJ **difilter otomatis** berdasarkan `tim_kerja_id` user yang login
- Semua Ketua Tim memakai sidebar yang **sama** — yang berbeda adalah data yang tampil

---

## Route Prefix per Role

| Role | Prefix URL | Middleware |
|---|---|---|
| Super Admin | `/super-admin/...` | `role:super_admin` |
| Ketua Tim Kerja | `/ketua-tim/...` | `role:ketua_tim_kerja` |
| Pimpinan | `/pimpinan/...` | `role:pimpinan` |
| Bendahara | `/bendahara/...` | `role:bendahara` |

Route didefinisikan di `routes/web.php`. Settings (profil, password) ada di `routes/settings.php`.

---

## Menu per Role

### Super Admin
- Dashboard
- Manajemen Dokumen: Perencanaan, Pertanggungjawaban, Keuangan, Dokumen
- Pengawasan: Validasi & Approval, Laporan, Notifikasi
- Administrasi: Kelola Pengguna, Data Master, Backup Data

### Ketua Tim Kerja
- Dashboard
- Perencanaan: Perjanjian Kinerja (Awal & Revisi), Rencana Aksi (Awal & Revisi)
- Keuangan: Permohonan Dana
- Pertanggungjawaban: LPJ
- Lainnya: Dokumen

### Pimpinan
- Dashboard
- Persetujuan: Approval, Validasi
- Laporan

### Bendahara
- Dashboard
- Keuangan: Pencairan Dana, Verifikasi LPJ, Laporan Keuangan

---

## Menjalankan Project

```bash
# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Migrasi dan seeder
php artisan migrate --seed

# Development
npm run dev
php artisan serve
```

## Generate Route TypeScript (Wayfinder)

```bash
php artisan wayfinder:generate
```

> Catatan: Pastikan tidak ada dua route PHP dengan nama yang sama di file berbeda, karena Wayfinder akan menggabungkan keduanya ke satu file TypeScript dan menyebabkan error duplicate export.
