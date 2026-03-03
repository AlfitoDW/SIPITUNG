<?php

namespace Database\Seeders;

use App\Models\TahunAnggaran;
use Illuminate\Database\Seeder;

class TahunAnggaranSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['tahun' => 2025, 'label' => 'TA 2025', 'is_active' => false, 'is_default' => false],
            ['tahun' => 2026, 'label' => 'TA 2026', 'is_active' => true, 'is_default' => true],
        ];

        foreach ($data as $item) {
            TahunAnggaran::firstOrCreate(
                ['tahun' => $item['tahun']],
                $item,
            );
        }
    }
}
