<?php

namespace Database\Factories;

use App\Models\DjaRincianBiaya;
use App\Models\DjaSubKegiatan;
use Illuminate\Database\Eloquent\Factories\Factory;

class DjaRincianBiayaFactory extends Factory
{
    protected $model = DjaRincianBiaya::class;

    public function definition(): array
    {
        return [
            'sub_kegiatan_id' => DjaSubKegiatan::factory(),
            'nama_item' => fake()->words(3, true),
            'volume_default' => fake()->numberBetween(1, 10),
            'satuan' => 'orang',
            'harga_satuan' => fake()->numberBetween(50000, 500000),
            'pagu_total' => fake()->numberBetween(1000000, 10000000),
            'urutan' => fake()->numberBetween(1, 100),
            'is_aktif' => true,
        ];
    }
}
