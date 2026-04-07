<?php

namespace Database\Seeders;

use App\Models\TimKerja;
use Illuminate\Database\Seeder;

class TimKerjaSeeder extends Seeder
{
    public function run(): void
    {
        $timKerja = [
            [
                'kode'         => 'TK-PK',
                'nama'         => 'Tim Kerja Perencanaan dan Keuangan',
                'nama_singkat' => 'P&K',
                'deskripsi'    => 'Bertanggung jawab dalam perencanaan strategis, penganggaran, dan pengelolaan keuangan institusi',
                'is_active'    => true,
            ],
            [
                'kode'         => 'TK-HKT',
                'nama'         => 'Tim Kerja Hukum, Kepegawaian, dan Tata Laksana',
                'nama_singkat' => 'HKT',
                'deskripsi'    => 'Menangani aspek hukum, pengelolaan SDM, dan tata kelola organisasi',
                'is_active'    => true,
            ],
            [
                'kode'         => 'TK-TUBMN',
                'nama'         => 'Tim Kerja Tata Usaha dan Barang Milik Negara',
                'nama_singkat' => 'TUBMN',
                'deskripsi'    => 'Mengelola administrasi umum dan barang milik negara',
                'is_active'    => true,
            ],
            [
                'kode'         => 'TK-HMK',
                'nama'         => 'Tim Kerja Hubungan Masyarakat dan Kerja Sama',
                'nama_singkat' => 'HM&K',
                'deskripsi'    => 'Membangun komunikasi publik dan kemitraan strategis',
                'is_active'    => true,
            ],
            [
                'kode'         => 'TK-KK',
                'nama'         => 'Tim Kerja Kelembagaan dan Kemitraan',
                'nama_singkat' => 'KK',
                'deskripsi'    => 'Mengembangkan kelembagaan dan kemitraan perguruan tinggi',
                'is_active'    => true,
            ],
            [
                'kode'         => 'TK-PENJAMU',
                'nama'         => 'Tim Kerja Penjaminan Mutu',
                'nama_singkat' => 'Penjamu',
                'deskripsi'    => 'Memastikan standar mutu pendidikan tinggi',
                'is_active'    => true,
            ],
            [
                'kode'         => 'TK-ADIA',
                'nama'         => 'Tim Kerja Anti Dosa Pendidikan dan Integritas Akademik',
                'nama_singkat' => 'ADIA',
                'deskripsi'    => 'Pencegahan fraud akademik dan integritas sistem akademik',
                'is_active'    => true,
            ],
            [
                'kode'         => 'TK-SD',
                'nama'         => 'Tim Kerja Sumber Daya',
                'nama_singkat' => 'SD',
                'deskripsi'    => 'Pengelolaan sumber daya manusia dan infrastruktur',
                'is_active'    => true,
            ],
            [
                'kode'         => 'TK-BELMAWA',
                'nama'         => 'Tim Kerja Pembelajaran, Kemahasiswaan, dan Prestasi',
                'nama_singkat' => 'Belmawa',
                'deskripsi'    => 'Pengembangan pembelajaran, kemahasiswaan, dan prestasi mahasiswa',
                'is_active'    => true,
            ],
            [
                'kode'         => 'TK-SIPD',
                'nama'         => 'Tim Kerja Sistem Informasi dan PDDikti',
                'nama_singkat' => 'SIPD',
                'deskripsi'    => 'Pengelolaan sistem informasi dan Pangkalan Data Pendidikan Tinggi',
                'is_active'    => true,
            ],
            [
                'kode'         => 'TK-RPM',
                'nama'         => 'Tim Kerja Riset dan Pengabdian Masyarakat',
                'nama_singkat' => 'RPM',
                'deskripsi'    => 'Fasilitasi penelitian dan pengabdian kepada masyarakat',
                'is_active'    => true,
            ],
        ];

        foreach ($timKerja as $tim) {
            TimKerja::updateOrCreate(['kode' => $tim['kode']], $tim);
        }
    }
}
