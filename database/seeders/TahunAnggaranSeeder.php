<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TahunAnggaranSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('tahun_anggaran')->insert([
            ['tahun' => 2025, 'label' => 'TA 2025', 'is_active' => true, 'is_default' => false, 'created_at' => now(), 'updated_at' => now()],
            ['tahun' => 2026, 'label' => 'TA 2026', 'is_active' => true, 'is_default' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
