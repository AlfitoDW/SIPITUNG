<?php

namespace Database\Factories;

use App\Models\DjaKegiatan;
use Illuminate\Database\Eloquent\Factories\Factory;

class DjaKegiatanFactory extends Factory
{
    protected $model = DjaKegiatan::class;

    public function definition(): array
    {
        return [
            'komponen_id' => null,
            'kode' => fake()->unique()->numerify('###.##'),
            'nama' => fake()->sentence(3),
            'pagu' => fake()->numberBetween(500000, 5000000),
            'is_aktif' => true,
        ];
    }
}
