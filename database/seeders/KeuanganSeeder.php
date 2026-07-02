<?php

namespace Database\Seeders;

use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use App\Models\UserTahunAnggaran;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class KeuanganSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('@lldikti3!');

        $this->seedPumk($password);
        $this->seedPicKeuangan($password);
    }

    private function seedPumk(string $password): void
    {
        $timKerjas = TimKerja::where('is_active', true)
            ->with('tahunAnggaran')
            ->whereNotNull('tahun_anggaran_id')
            ->orderBy('tahun_anggaran_id')
            ->orderBy('kode')
            ->get()
            ->groupBy('kode');

        foreach ($timKerjas as $kode => $rows) {
            $primaryTim = $rows->firstWhere('tahunAnggaran.is_default', true) ?? $rows->first();
            $kodeLower = strtolower(str_replace('TK-', '', $kode));

            $user = User::updateOrCreate(
                ['username' => "pumk.{$kodeLower}"],
                [
                    'nama_lengkap' => 'PUMK '.$primaryTim->nama,
                    'nip' => null,
                    'email' => "pumk.{$kodeLower}@lldikti3.go.id",
                    'password' => $password,
                    'role' => 'pumk',
                    'tim_kerja_id' => $primaryTim->id,
                    'pimpinan_type' => null,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            foreach ($rows as $timKerja) {
                UserTahunAnggaran::updateOrCreate(
                    ['user_id' => $user->id, 'tahun_anggaran_id' => $timKerja->tahun_anggaran_id],
                    [
                        'tim_kerja_id' => $timKerja->id,
                        'role' => 'pumk',
                        'pimpinan_type' => null,
                        'is_active' => true,
                    ]
                );
            }
        }
    }

    private function seedPicKeuangan(string $password): void
    {
        $picKeuanganList = [
            ['username' => 'pic.elih', 'nama_lengkap' => 'Elih Ermawati', 'nip' => '198609152009122006'],
            ['username' => 'pic.prayitno', 'nama_lengkap' => 'Prayitno', 'nip' => null],
            ['username' => 'pic.yeni', 'nama_lengkap' => 'Yeni Handayani', 'nip' => '198404022015042002'],
            ['username' => 'pic.tantri', 'nama_lengkap' => 'Tantri Rinjani', 'nip' => '198609102010012029'],
        ];

        $tahunAnggarans = TahunAnggaran::where('is_active', true)->get();

        foreach ($picKeuanganList as $pic) {
            $user = User::updateOrCreate(
                ['username' => $pic['username']],
                [
                    'nama_lengkap' => $pic['nama_lengkap'],
                    'nip' => $pic['nip'],
                    'email' => null,
                    'password' => $password,
                    'role' => 'pic_keuangan',
                    'tim_kerja_id' => null,
                    'pimpinan_type' => null,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            foreach ($tahunAnggarans as $tahunAnggaran) {
                UserTahunAnggaran::updateOrCreate(
                    ['user_id' => $user->id, 'tahun_anggaran_id' => $tahunAnggaran->id],
                    [
                        'tim_kerja_id' => null,
                        'role' => 'pic_keuangan',
                        'pimpinan_type' => null,
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
