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
            'name' => 'Super Admin',
            'email' => 'superadmin@lldikti3.go.id',
            'username' => 'superadmin',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // 2. Pimpinan - Kabag Umum
        User::create([
            'name' => 'Kepala Bagian Umum',
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
            'name' => 'Pejabat Pembuat Komitmen',
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
            'name' => 'Bendahara LLDIKTI 3',
            'username' => 'bendahara',
            'email' => 'bendahara@lldikti3.go.id',
            'password' => Hash::make('password'),
            'role' => 'bendahara',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // 5-15. Ketua Tim Kerja (11 Tim)
        $timKerjaUsers = [
            ['name' => 'Ketua Tim Perencanaan dan Keuangan', 'username' => 'ketua.pku', 'email' => 'ketua.pku@lldikti3.go.id', 'tim_kerja_id' => 1],
            ['name' => 'Ketua Tim Hukum dan Kepegawaian', 'username' => 'ketua.hkl', 'email' => 'ketua.hkl@lldikti3.go.id', 'tim_kerja_id' => 2],
            ['name' => 'Ketua Tim Tata Usaha dan BMN', 'username' => 'ketua.tbn', 'email' => 'ketua.tbn@lldikti3.go.id', 'tim_kerja_id' => 3],
            ['name' => 'Ketua Tim Humas dan Kerja Sama', 'username' => 'ketua.hks', 'email' => 'ketua.hks@lldikti3.go.id', 'tim_kerja_id' => 4],
            ['name' => 'Ketua Tim Kelembagaan', 'username' => 'ketua.kkm', 'email' => 'ketua.kkm@lldikti3.go.id', 'tim_kerja_id' => 5],
            ['name' => 'Ketua Tim Penjaminan Mutu', 'username' => 'ketua.pmu', 'email' => 'ketua.pmu@lldikti3.go.id', 'tim_kerja_id' => 6],
            ['name' => 'Ketua Tim Anti Dosa Pendidikan', 'username' => 'ketua.aia', 'email' => 'ketua.aia@lldikti3.go.id', 'tim_kerja_id' => 7],
            ['name' => 'Ketua Tim Sumber Daya', 'username' => 'ketua.sdy', 'email' => 'ketua.sdy@lldikti3.go.id', 'tim_kerja_id' => 8],
            ['name' => 'Ketua Tim Pembelajaran', 'username' => 'ketua.pkp', 'email' => 'ketua.pkp@lldikti3.go.id', 'tim_kerja_id' => 9],
            ['name' => 'Ketua Tim Sistem Informasi', 'username' => 'ketua.sip', 'email' => 'ketua.sip@lldikti3.go.id', 'tim_kerja_id' => 10],
            ['name' => 'Ketua Tim Penelitian', 'username' => 'ketua.ppm', 'email' => 'ketua.ppm@lldikti3.go.id', 'tim_kerja_id' => 11],
        ];

        foreach ($timKerjaUsers as $userData) {
            User::create([
                'name' => $userData['name'],
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