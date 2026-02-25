<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TimKerjaSeeder extends Seeder
{
    public function run(): void
    {
        $timKerja = [
            [
                'kode' => 'TK-PKU',
                'nama' => 'Tim Kerja Perencanaan dan Keuangan',
                'nama_singkat' => 'Perencanaan & Keuangan',
                'deskripsi' => 'Bertanggung jawab dalam perencanaan strategis, penganggaran, dan pengelolaan keuangan institusi',
                'is_active' => true,
            ],
            [
                'kode' => 'TK-HKL',
                'nama' => 'Tim Kerja Hukum, Kepegawaian, dan Tata Laksana',
                'nama_singkat' => 'Hukum & Kepegawaian',
                'deskripsi' => 'Menangani aspek hukum, pengelolaan SDM, dan tata kelola organisasi',
                'is_active' => true,
            ],
            [
                'kode' => 'TK-TBN',
                'nama' => 'Tim Kerja Tata Usaha dan Barang Milik Negara',
                'nama_singkat' => 'Tata Usaha & BMN',
                'deskripsi' => 'Mengelola administrasi umum dan barang milik negara',
                'is_active' => true,
            ],
            [
                'kode' => 'TK-HKS',
                'nama' => 'Tim Kerja Hubungan Masyarakat dan Kerja Sama',
                'nama_singkat' => 'Humas & Kerja Sama',
                'deskripsi' => 'Membangun komunikasi publik dan kemitraan strategis',
                'is_active' => true,
            ],
            [
                'kode' => 'TK-KKM',
                'nama' => 'Tim Kerja Kelembagaan dan Kemitraan',
                'nama_singkat' => 'Kelembagaan',
                'deskripsi' => 'Mengembangkan kelembagaan dan kemitraan perguruan tinggi',
                'is_active' => true,
            ],
            [
                'kode' => 'TK-PMU',
                'nama' => 'Tim Kerja Penjaminan Mutu',
                'nama_singkat' => 'Penjaminan Mutu',
                'deskripsi' => 'Memastikan standar mutu pendidikan tinggi',
                'is_active' => true,
            ],
            [
                'kode' => 'TK-AIA',
                'nama' => 'Tim Kerja Anti Dosa Pendidikan dan Integrasi Akademik',
                'nama_singkat' => 'Anti Dosa Pendidikan',
                'deskripsi' => 'Pencegahan fraud akademik dan integrasi sistem akademik',
                'is_active' => true,
            ],
            [
                'kode' => 'TK-SDY',
                'nama' => 'Tim Kerja Sumber Daya',
                'nama_singkat' => 'Sumber Daya',
                'deskripsi' => 'Pengelolaan sumber daya manusia dan infrastruktur',
                'is_active' => true,
            ],
            [
                'kode' => 'TK-PKP',
                'nama' => 'Tim Kerja Pembelajaran, Kemahasiswaan, dan Prestasi',
                'nama_singkat' => 'Pembelajaran',
                'deskripsi' => 'Pengembangan pembelajaran, kemahasiswaan, dan prestasi mahasiswa',
                'is_active' => true,
            ],
            [
                'kode' => 'TK-SIP',
                'nama' => 'Tim Kerja Sistem Informasi dan PDDikti',
                'nama_singkat' => 'Sistem Informasi',
                'deskripsi' => 'Pengelolaan sistem informasi dan Pangkalan Data Pendidikan Tinggi',
                'is_active' => true,
            ],
            [
                'kode' => 'TK-PPM',
                'nama' => 'Tim Kerja Penelitian dan Pengabdian Masyarakat',
                'nama_singkat' => 'Penelitian & Pengabdian',
                'deskripsi' => 'Fasilitasi penelitian dan pengabdian kepada masyarakat',
                'is_active' => true,
            ],
        ];

        foreach ($timKerja as $tim) {
            DB::table('tim_kerja')->insert(array_merge($tim, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}