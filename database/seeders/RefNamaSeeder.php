<?php

namespace Database\Seeders;

use App\Models\RefNama;
use App\Models\TahunAnggaran;
use App\Models\User;
use App\Models\UserTahunAnggaran;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RefNamaSeeder extends Seeder
{
    public function run(): void
    {
        $pegawai = [
            // PNS Gol IV → PPh21 15%
            [
                'nama' => 'Dr. Siti Rahma Dewi, M.Pd.',
                'nip' => '196805121994032001',
                'nik' => '3174055208680003',
                'npwp' => '12.345.678.9-012.000',
                'gol_ruang' => 'IV/a',
                'status_kepegawaian' => 'PNS',
                'nama_rekening' => 'SITI RAHMA DEWI',
                'no_rekening' => '1234567890',
                'nama_bank' => 'BNI',
                'email' => 'siti.rahma@lldikti3.id',
            ],
            [
                'nama' => 'Prof. Dr. Bambang Santoso, M.Si.',
                'nip' => '196203041990031002',
                'nik' => '3175020403620002',
                'npwp' => '23.456.789.0-013.000',
                'gol_ruang' => 'IV/c',
                'status_kepegawaian' => 'PNS',
                'nama_rekening' => 'BAMBANG SANTOSO',
                'no_rekening' => '0987654321',
                'nama_bank' => 'Mandiri',
                'email' => 'bambang.santoso@lldikti3.id',
            ],
            // PNS Gol III → PPh21 5%
            [
                'nama' => 'Agus Priyatno, S.Kom., M.T.',
                'nip' => '198204152010121003',
                'nik' => '3173041504820001',
                'npwp' => '34.567.890.1-014.000',
                'gol_ruang' => 'III/b',
                'status_kepegawaian' => 'PNS',
                'nama_rekening' => 'AGUS PRIYATNO',
                'no_rekening' => '1122334455',
                'nama_bank' => 'BRI',
                'email' => 'agus.priyatno@lldikti3.id',
            ],
            [
                'nama' => 'Dewi Kusumawati, S.E., M.M.',
                'nip' => '197906232008012004',
                'nik' => '3174022306790004',
                'npwp' => '45.678.901.2-015.000',
                'gol_ruang' => 'III/c',
                'status_kepegawaian' => 'PNS',
                'nama_rekening' => 'DEWI KUSUMAWATI',
                'no_rekening' => '5544332211',
                'nama_bank' => 'BNI',
                'email' => 'dewi.kusuma@lldikti3.id',
            ],
            [
                'nama' => 'Rudi Hermawan, S.H.',
                'nip' => '199001152018021005',
                'nik' => '3175011501900005',
                'npwp' => '56.789.012.3-016.000',
                'gol_ruang' => 'III/a',
                'status_kepegawaian' => 'PNS',
                'nama_rekening' => 'RUDI HERMAWAN',
                'no_rekening' => '6677889900',
                'nama_bank' => 'BTN',
                'email' => 'rudi.hermawan@lldikti3.id',
            ],
            // PNS Gol II → PPh21 0%
            [
                'nama' => 'Slamet Widodo',
                'nip' => '199505202019121006',
                'nik' => '3174012005950006',
                'npwp' => '67.890.123.4-017.000',
                'gol_ruang' => 'II/c',
                'status_kepegawaian' => 'PNS',
                'nama_rekening' => 'SLAMET WIDODO',
                'no_rekening' => '1029384756',
                'nama_bank' => 'BRI',
                'email' => 'slamet.widodo@lldikti3.id',
            ],
            [
                'nama' => 'Nur Aini',
                'nip' => '199808082020012007',
                'nik' => '3174010808980007',
                'npwp' => null,
                'gol_ruang' => 'II/b',
                'status_kepegawaian' => 'PNS',
                'nama_rekening' => 'NUR AINI',
                'no_rekening' => '2938475610',
                'nama_bank' => 'Mandiri',
                'email' => 'nur.aini@lldikti3.id',
            ],
            // Non-PNS → PPh21 2.5% flat
            [
                'nama' => 'Dr. Irwan Kusuma, M.Sc.',
                'nip' => null,
                'nik' => '3175041205820008',
                'npwp' => '78.901.234.5-018.000',
                'gol_ruang' => 'Non PNS',
                'status_kepegawaian' => 'Non-PNS',
                'nama_rekening' => 'IRWAN KUSUMA',
                'no_rekening' => '8877665544',
                'nama_bank' => 'BCA',
                'email' => 'irwan.kusuma@gmail.com',
            ],
            [
                'nama' => 'Rina Fitriani, M.Kom.',
                'nip' => null,
                'nik' => '3174022508920009',
                'npwp' => '89.012.345.6-019.000',
                'gol_ruang' => 'Non PNS',
                'status_kepegawaian' => 'Non-PNS',
                'nama_rekening' => 'RINA FITRIANI',
                'no_rekening' => '3344556677',
                'nama_bank' => 'BCA',
                'email' => 'rina.fitriani@consultant.id',
            ],
            // Non-PNS → PPh21 2.5% flat
            [
                'nama' => 'Hendrik Prasetyo',
                'nip' => null,
                'nik' => '3173031003960010',
                'npwp' => null,
                'gol_ruang' => 'Non PNS',
                'status_kepegawaian' => 'Non-PNS',
                'nama_rekening' => 'HENDRIK PRASETYO',
                'no_rekening' => '9988776655',
                'nama_bank' => 'CIMB Niaga',
                'email' => 'hendrik.prasetyo@freelance.id',
            ],
            [
                'nama' => 'Elih Ermawati',
                'nip' => '198609152009122006',
                'nik' => '3275085508860013',
                'npwp' => null,
                'gol_ruang' => 'III/b',
                'status_kepegawaian' => 'PNS',
                'nama_rekening' => 'ELIH ERMAWATI',
                'no_rekening' => null,
                'nama_bank' => null,
                'email' => null,
            ],
            [
                'nama' => 'Prayitno',
                'nip' => null,
                'nik' => '3174082203800005',
                'npwp' => null,
                'gol_ruang' => 'Non PNS',
                'status_kepegawaian' => 'Non-PNS',
                'nama_rekening' => 'PRAYITNO',
                'no_rekening' => null,
                'nama_bank' => null,
                'email' => null,
            ],
            [
                'nama' => 'Yeni Handayani',
                'nip' => '198404022015042002',
                'nik' => '3175014204840007',
                'npwp' => null,
                'gol_ruang' => 'III/b',
                'status_kepegawaian' => 'PNS',
                'nama_rekening' => 'YENI HANDAYANI',
                'no_rekening' => null,
                'nama_bank' => null,
                'email' => null,
            ],
            [
                'nama' => 'Tantri Rinjani',
                'nip' => '198609102010012029',
                'nik' => '1672015009860004',
                'npwp' => null,
                'gol_ruang' => 'III/b',
                'status_kepegawaian' => 'PNS',
                'nama_rekening' => 'TANTRI RINJANI',
                'no_rekening' => null,
                'nama_bank' => null,
                'email' => null,
            ],
        ];

        foreach ($pegawai as $data) {
            $pph21 = RefNama::hitungPph21(
                $data['status_kepegawaian'],
                $data['gol_ruang'] ?? null,
                $data['npwp'] ?? null,
            );

            RefNama::updateOrCreate(
                ['nik' => $data['nik']],
                array_merge($data, ['pph21_persen' => $pph21, 'is_aktif' => true]),
            );
        }

        // ─── PIC Keuangan Global — diambil dari data ref_nama ───────────────────
        $picKeuanganList = [
            ['nik' => '3275085508860013', 'username' => 'pic.elih'],
            ['nik' => '3174082203800005', 'username' => 'pic.prayitno'],
            ['nik' => '3175014204840007', 'username' => 'pic.yeni'],
            ['nik' => '1672015009860004', 'username' => 'pic.tantri'],
        ];
        $picUsernames = array_column($picKeuanganList, 'username');

        User::where('role', 'pic_keuangan')
            ->whereNotIn('username', $picUsernames)
            ->update(['is_active' => false]);

        UserTahunAnggaran::where('role', 'pic_keuangan')
            ->whereHas('user', fn ($query) => $query->whereNotIn('username', $picUsernames))
            ->update(['is_active' => false]);

        foreach ($picKeuanganList as $pic) {
            $ref = RefNama::where('nik', $pic['nik'])->first();
            if (! $ref) {
                $this->command->warn("RefNamaSeeder: ref_nama dengan NIK {$pic['nik']} tidak ditemukan, PIC Keuangan {$pic['username']} dilewati.");

                continue;
            }

            $user = User::updateOrCreate(
                ['username' => $pic['username']],
                [
                    'nama_lengkap' => $ref->nama,
                    'nip' => $ref->nip,
                    'username' => $pic['username'],
                    'email' => null,
                    'password' => Hash::make('@lldikti3!'),
                    'role' => 'pic_keuangan',
                    'tim_kerja_id' => null,
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );

            TahunAnggaran::where('is_active', true)->get()->each(function (TahunAnggaran $tahun) use ($user) {
                UserTahunAnggaran::updateOrCreate(
                    ['user_id' => $user->id, 'tahun_anggaran_id' => $tahun->id],
                    [
                        'tim_kerja_id' => null,
                        'role' => 'pic_keuangan',
                        'pimpinan_type' => null,
                        'is_active' => true,
                    ]
                );
            });
        }
    }
}
