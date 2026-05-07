<?php

namespace Database\Seeders;

use App\Models\RefNama;
use Illuminate\Database\Seeder;

class RefNamaSeeder extends Seeder
{
    public function run(): void
    {
        $pegawai = [
            // PNS Gol IV → PPh21 15%
            [
                'nama'              => 'Dr. Siti Rahma Dewi, M.Pd.',
                'nip'               => '196805121994032001',
                'nik'               => '3174055208680003',
                'npwp'              => '12.345.678.9-012.000',
                'gol_ruang'         => 'IV/a',
                'status_kepegawaian'=> 'PNS',
                'nama_rekening'     => 'SITI RAHMA DEWI',
                'no_rekening'       => '1234567890',
                'nama_bank'         => 'BNI',
                'email'             => 'siti.rahma@lldikti3.id',
            ],
            [
                'nama'              => 'Prof. Dr. Bambang Santoso, M.Si.',
                'nip'               => '196203041990031002',
                'nik'               => '3175020403620002',
                'npwp'              => '23.456.789.0-013.000',
                'gol_ruang'         => 'IV/c',
                'status_kepegawaian'=> 'PNS',
                'nama_rekening'     => 'BAMBANG SANTOSO',
                'no_rekening'       => '0987654321',
                'nama_bank'         => 'Mandiri',
                'email'             => 'bambang.santoso@lldikti3.id',
            ],
            // PNS Gol III → PPh21 5%
            [
                'nama'              => 'Agus Priyatno, S.Kom., M.T.',
                'nip'               => '198204152010121003',
                'nik'               => '3173041504820001',
                'npwp'              => '34.567.890.1-014.000',
                'gol_ruang'         => 'III/b',
                'status_kepegawaian'=> 'PNS',
                'nama_rekening'     => 'AGUS PRIYATNO',
                'no_rekening'       => '1122334455',
                'nama_bank'         => 'BRI',
                'email'             => 'agus.priyatno@lldikti3.id',
            ],
            [
                'nama'              => 'Dewi Kusumawati, S.E., M.M.',
                'nip'               => '197906232008012004',
                'nik'               => '3174022306790004',
                'npwp'              => '45.678.901.2-015.000',
                'gol_ruang'         => 'III/c',
                'status_kepegawaian'=> 'PNS',
                'nama_rekening'     => 'DEWI KUSUMAWATI',
                'no_rekening'       => '5544332211',
                'nama_bank'         => 'BNI',
                'email'             => 'dewi.kusuma@lldikti3.id',
            ],
            [
                'nama'              => 'Rudi Hermawan, S.H.',
                'nip'               => '199001152018021005',
                'nik'               => '3175011501900005',
                'npwp'              => '56.789.012.3-016.000',
                'gol_ruang'         => 'III/a',
                'status_kepegawaian'=> 'PNS',
                'nama_rekening'     => 'RUDI HERMAWAN',
                'no_rekening'       => '6677889900',
                'nama_bank'         => 'BTN',
                'email'             => 'rudi.hermawan@lldikti3.id',
            ],
            // PNS Gol II → PPh21 0%
            [
                'nama'              => 'Slamet Widodo',
                'nip'               => '199505202019121006',
                'nik'               => '3174012005950006',
                'npwp'              => '67.890.123.4-017.000',
                'gol_ruang'         => 'II/c',
                'status_kepegawaian'=> 'PNS',
                'nama_rekening'     => 'SLAMET WIDODO',
                'no_rekening'       => '1029384756',
                'nama_bank'         => 'BRI',
                'email'             => 'slamet.widodo@lldikti3.id',
            ],
            [
                'nama'              => 'Nur Aini',
                'nip'               => '199808082020012007',
                'nik'               => '3174010808980007',
                'npwp'              => null,
                'gol_ruang'         => 'II/b',
                'status_kepegawaian'=> 'PNS',
                'nama_rekening'     => 'NUR AINI',
                'no_rekening'       => '2938475610',
                'nama_bank'         => 'Mandiri',
                'email'             => 'nur.aini@lldikti3.id',
            ],
            // Non-PNS + NPWP → PPh21 3%
            [
                'nama'              => 'Dr. Irwan Kusuma, M.Sc.',
                'nip'               => null,
                'nik'               => '3175041205820008',
                'npwp'              => '78.901.234.5-018.000',
                'gol_ruang'         => 'Non PNS',
                'status_kepegawaian'=> 'Non-PNS',
                'nama_rekening'     => 'IRWAN KUSUMA',
                'no_rekening'       => '8877665544',
                'nama_bank'         => 'BCA',
                'email'             => 'irwan.kusuma@gmail.com',
            ],
            [
                'nama'              => 'Rina Fitriani, M.Kom.',
                'nip'               => null,
                'nik'               => '3174022508920009',
                'npwp'              => '89.012.345.6-019.000',
                'gol_ruang'         => 'Non PNS',
                'status_kepegawaian'=> 'Non-PNS',
                'nama_rekening'     => 'RINA FITRIANI',
                'no_rekening'       => '3344556677',
                'nama_bank'         => 'BCA',
                'email'             => 'rina.fitriani@consultant.id',
            ],
            // Non-PNS tanpa NPWP → PPh21 2.5%
            [
                'nama'              => 'Hendrik Prasetyo',
                'nip'               => null,
                'nik'               => '3173031003960010',
                'npwp'              => null,
                'gol_ruang'         => 'Non PNS',
                'status_kepegawaian'=> 'Non-PNS',
                'nama_rekening'     => 'HENDRIK PRASETYO',
                'no_rekening'       => '9988776655',
                'nama_bank'         => 'CIMB Niaga',
                'email'             => 'hendrik.prasetyo@freelance.id',
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
    }
}
