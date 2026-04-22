<?php

namespace Database\Seeders;

use App\Models\TimKerja;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('@lldikti3!');

        // 1. Super Admin
        User::updateOrCreate(
            ['role' => 'super_admin'],
            [
                'nama_lengkap' => 'Administrator',
                'nip' => null,
                'username' => 'superadmin',
                'email' => 'superadmin@lldikti3.go.id',
                'password' => $password,
                'role' => 'super_admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 2. Pimpinan - Kepala Bagian Umum
        User::updateOrCreate(
            ['role' => 'pimpinan', 'pimpinan_type' => 'kabag_umum'],
            [
                'nama_lengkap' => 'Tri Munanto',
                'nip' => null,
                'username' => 'kabagumum',
                'email' => 'kabagumum@lldikti3.go.id',
                'password' => $password,
                'role' => 'pimpinan',
                'pimpinan_type' => 'kabag_umum',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 3. Pimpinan - PPK
        User::updateOrCreate(
            ['role' => 'pimpinan', 'pimpinan_type' => 'ppk'],
            [
                'nama_lengkap' => 'Agung Permana N.',
                'nip' => null,
                'username' => 'ppk',
                'email' => 'ppk@lldikti3.go.id',
                'password' => $password,
                'role' => 'pimpinan',
                'pimpinan_type' => 'ppk',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 4. Bendahara
        User::updateOrCreate(
            ['role' => 'bendahara'],
            [
                'nama_lengkap' => 'Bendahara',
                'nip' => null,
                'username' => 'bendahara',
                'email' => 'bendahara@lldikti3.go.id',
                'password' => $password,
                'role' => 'bendahara',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 5–15. Ketua Tim Kerja — username tetap format ketua.xxx, nama_lengkap pakai nama asli
        // Format: kode_tim => [username, nama_lengkap, email_suffix]
        $ketuas = [
            'TK-PK' => ['ketua.pk',      'Raafita Agustiana',          'ketua.pk'],
            'TK-HKT' => ['ketua.hkt',     'Titah Widihastuti',          'ketua.hkt'],
            'TK-TUBMN' => ['ketua.tubmn',   'Agung Permana N.',           'ketua.tubmn'],
            'TK-HMK' => ['ketua.hmk',     'Maghfira Syalendri Alqadri', 'ketua.hmk'],
            'TK-KK' => ['ketua.kk',      'Mulhadi HM',                 'ketua.kk'],
            'TK-PENJAMU' => ['ketua.penjamu', 'Ikhsan Riyanda',             'ketua.penjamu'],
            'TK-ADIA' => ['ketua.adia',    'Taufan Setyo Pranggono',     'ketua.adia'],
            'TK-SD' => ['ketua.sd',      'Ina Agustiani',              'ketua.sd'],
            'TK-BELMAWA' => ['ketua.belmawa', 'Dian Rusdiana',              'ketua.belmawa'],
            'TK-SIPD' => ['ketua.sipd',    'Wiji Murdoko',               'ketua.sipd'],
            'TK-RPM' => ['ketua.rpm',     'Aprie Wellandira Suhardi',   'ketua.rpm'],
        ];

        foreach ($ketuas as $kode => [$username, $namaLengkap, $emailPrefix]) {
            $timKerja = TimKerja::where('kode', $kode)->first();
            if (! $timKerja) {
                $this->command->warn("UserSeeder: Tim {$kode} tidak ditemukan, dilewati.");

                continue;
            }

            User::updateOrCreate(
                ['role' => 'ketua_tim_kerja', 'tim_kerja_id' => $timKerja->id],
                [
                    'nama_lengkap' => $namaLengkap,
                    'nip' => null,
                    'username' => $username,
                    'email' => "{$emailPrefix}@lldikti3.go.id",
                    'password' => $password,
                    'role' => 'ketua_tim_kerja',
                    'tim_kerja_id' => $timKerja->id,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
