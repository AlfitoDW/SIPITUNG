<?php

namespace Database\Factories;

use App\Models\DjaKegiatan;
use App\Models\DjaSubKegiatan;
use Illuminate\Database\Eloquent\Factories\Factory;

class DjaSubKegiatanFactory extends Factory
{
    protected $model = DjaSubKegiatan::class;

    public function definition(): array
    {
        return [
            'kegiatan_id' => DjaKegiatan::factory(),
            'kode_akun' => fake()->numerify('######'),
            'nama_akun' => fake()->words(2, true),
            'pagu' => fake()->numberBetween(1000000, 10000000),
            'urutan' => fake()->numberBetween(1, 100),
            'is_aktif' => true,
        ];
    }
}
