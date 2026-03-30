<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\TimKerja;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            TimKerjaSeeder::class,
            UserSeeder::class,
            TahunAnggaranSeeder::class,
            PerencanaanSeeder::class,
            KeuanganSeeder::class,
        ]);
    }
}
