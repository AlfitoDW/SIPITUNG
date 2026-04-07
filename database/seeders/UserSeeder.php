<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\TimKerja;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Super Admin
        User::updateOrCreate(['username' => 'superadmin'], [
            'nama_lengkap'       => 'Administrator',
            'nip'                => null,
            'email'              => 'superadmin@lldikti3.go.id',
            'password'           => Hash::make('password'),
            'role'               => 'super_admin',
            'is_active'          => true,
            'email_verified_at'  => now(),
        ]);

        // 2. Pimpinan - Kabag Umum
        User::updateOrCreate(['username' => 'kabagumum'], [
            'nama_lengkap'       => 'Nama Kabag Umum',
            'nip'                => '198501012010011001',
            'email'              => 'kabagumum@lldikti3.go.id',
            'password'           => Hash::make('password'),
            'role'               => 'pimpinan',
            'pimpinan_type'      => 'kabag_umum',
            'is_active'          => true,
            'email_verified_at'  => now(),
        ]);

        // 3. Pimpinan - PPK
        User::updateOrCreate(['username' => 'ppk'], [
            'nama_lengkap'       => 'Nama PPK',
            'nip'                => '198601012011011002',
            'email'              => 'ppk@lldikti3.go.id',
            'password'           => Hash::make('password'),
            'role'               => 'pimpinan',
            'pimpinan_type'      => 'ppk',
            'is_active'          => true,
            'email_verified_at'  => now(),
        ]);

        // 4. Bendahara
        User::updateOrCreate(['username' => 'bendahara'], [
            'nama_lengkap'       => 'Nama Bendahara',
            'nip'                => '198701012012011003',
            'email'              => 'bendahara@lldikti3.go.id',
            'password'           => Hash::make('password'),
            'role'               => 'bendahara',
            'is_active'          => true,
            'email_verified_at'  => now(),
        ]);

        // 5–15. Ketua Tim Kerja (11 Tim) — username & email berdasarkan singkatan
        // kode tim_kerja => [username_suffix, singkatan_email, nama_lengkap]
        $ketuas = [
            'TK-PK'      => ['pk',      'P&K',    'Ketua Tim Perencanaan dan Keuangan'],
            'TK-HKT'     => ['hkt',     'HKT',    'Ketua Tim Hukum, Kepegawaian, dan Tata Laksana'],
            'TK-TUBMN'   => ['tubmn',   'TUBMN',  'Ketua Tim Tata Usaha dan Barang Milik Negara'],
            'TK-HMK'     => ['hmk',     'HM&K',   'Ketua Tim Humas dan Kerja Sama'],
            'TK-KK'      => ['kk',      'KK',     'Ketua Tim Kelembagaan dan Kemitraan'],
            'TK-PENJAMU' => ['penjamu', 'Penjamu', 'Ketua Tim Penjaminan Mutu'],
            'TK-ADIA'    => ['adia',    'ADIA',   'Ketua Tim Anti Dosa Pendidikan dan Integritas Akademik'],
            'TK-SD'      => ['sd',      'SD',     'Ketua Tim Sumber Daya'],
            'TK-BELMAWA' => ['belmawa', 'Belmawa','Ketua Tim Pembelajaran, Kemahasiswaan, dan Prestasi'],
            'TK-SIPD'    => ['sipd',    'SIPD',   'Ketua Tim Sistem Informasi dan PDDikti'],
            'TK-RPM'     => ['rpm',     'RPM',    'Ketua Tim Riset dan Pengabdian Masyarakat'],
        ];

        $nip = 198801012013011001;
        foreach ($ketuas as $kode => [$suffix, $singkat, $namaLengkap]) {
            $timKerja = TimKerja::where('kode', $kode)->first();
            if (! $timKerja) continue;

            // email: ganti & → '' dan spasi → '', lowercase
            $emailKey = strtolower(str_replace(['&', ' '], '', $singkat));

            $attrs = [
                'nama_lengkap'      => $namaLengkap,
                'nip'               => (string) $nip,
                'username'          => "ketua.{$suffix}",
                'email'             => "ketua.{$emailKey}@lldikti3.go.id",
                'password'          => Hash::make('password'),
                'role'              => 'ketua_tim_kerja',
                'tim_kerja_id'      => $timKerja->id,
                'is_active'         => true,
                'email_verified_at' => now(),
            ];

            // Cari berdasarkan tim_kerja_id agar bisa update username in-place
            $existing = User::where('tim_kerja_id', $timKerja->id)
                ->where('role', 'ketua_tim_kerja')
                ->first();

            if ($existing) {
                $existing->update($attrs);
            } else {
                User::create($attrs);
            }

            $nip++;
        }
    }
}
