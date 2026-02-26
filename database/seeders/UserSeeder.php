<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Super Admin
        User::create([
            'nama_lengkap' => 'Administrator',
            'nip' => null,
            'email' => 'superadmin@lldikti3.go.id',
            'username' => 'superadmin',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // 2. Pimpinan - Kabag Umum
        User::create([
            'nama_lengkap' => 'Nama Kabag Umum',
            'nip' => '198501012010011001',
            'username' => 'kabagumum',
            'email' => 'kabagumum@lldikti3.go.id',
            'password' => Hash::make('password'),
            'role' => 'pimpinan',
            'pimpinan_type' => 'kabag_umum',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // 3. Pimpinan - PPK
        User::create([
            'nama_lengkap' => 'Nama PPK',
            'nip' => '198601012011011002',
            'username' => 'ppk',
            'email' => 'ppk@lldikti3.go.id',
            'password' => Hash::make('password'),
            'role' => 'pimpinan',
            'pimpinan_type' => 'ppk',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // 4. Bendahara
        User::create([
            'nama_lengkap' => 'Nama Bendahara',
            'nip' => '198701012012011003',
            'username' => 'bendahara',
            'email' => 'bendahara@lldikti3.go.id',
            'password' => Hash::make('password'),
            'role' => 'bendahara',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // 5-15. Ketua Tim Kerja (11 Tim)
        $timKerjaUsers = [
            ['nama_lengkap' => 'Nama Ketua Tim PKU',  'username' => 'ketua.pku', 'email' => 'ketua.pku@lldikti3.go.id', 'nip' => '198801012013011001', 'tim_kerja_id' => 1],
            ['nama_lengkap' => 'Nama Ketua Tim HKL',  'username' => 'ketua.hkl', 'email' => 'ketua.hkl@lldikti3.go.id', 'nip' => '198801012013011002', 'tim_kerja_id' => 2],
            ['nama_lengkap' => 'Nama Ketua Tim TBN',  'username' => 'ketua.tbn', 'email' => 'ketua.tbn@lldikti3.go.id', 'nip' => '198801012013011003', 'tim_kerja_id' => 3],
            ['nama_lengkap' => 'Nama Ketua Tim HKS',  'username' => 'ketua.hks', 'email' => 'ketua.hks@lldikti3.go.id', 'nip' => '198801012013011004', 'tim_kerja_id' => 4],
            ['nama_lengkap' => 'Nama Ketua Tim KKM',  'username' => 'ketua.kkm', 'email' => 'ketua.kkm@lldikti3.go.id', 'nip' => '198801012013011005', 'tim_kerja_id' => 5],
            ['nama_lengkap' => 'Nama Ketua Tim PMU',  'username' => 'ketua.pmu', 'email' => 'ketua.pmu@lldikti3.go.id', 'nip' => '198801012013011006', 'tim_kerja_id' => 6],
            ['nama_lengkap' => 'Nama Ketua Tim AIA',  'username' => 'ketua.aia', 'email' => 'ketua.aia@lldikti3.go.id', 'nip' => '198801012013011007', 'tim_kerja_id' => 7],
            ['nama_lengkap' => 'Nama Ketua Tim SDY',  'username' => 'ketua.sdy', 'email' => 'ketua.sdy@lldikti3.go.id', 'nip' => '198801012013011008', 'tim_kerja_id' => 8],
            ['nama_lengkap' => 'Nama Ketua Tim PKP',  'username' => 'ketua.pkp', 'email' => 'ketua.pkp@lldikti3.go.id', 'nip' => '198801012013011009', 'tim_kerja_id' => 9],
            ['nama_lengkap' => 'Nama Ketua Tim SIP',  'username' => 'ketua.sip', 'email' => 'ketua.sip@lldikti3.go.id', 'nip' => '198801012013011010', 'tim_kerja_id' => 10],
            ['nama_lengkap' => 'Nama Ketua Tim PPM',  'username' => 'ketua.ppm', 'email' => 'ketua.ppm@lldikti3.go.id', 'nip' => '198801012013011011', 'tim_kerja_id' => 11],
        ];

        foreach ($timKerjaUsers as $userData) {
            User::create([
                'nama_lengkap' => $userData['nama_lengkap'],
                'nip' => $userData['nip'],
                'username' => $userData['username'],
                'email' => $userData['email'],
                'password' => Hash::make('password'),
                'role' => 'ketua_tim_kerja',
                'tim_kerja_id' => $userData['tim_kerja_id'],
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        }
    }
}
