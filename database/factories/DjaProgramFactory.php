<?php

namespace Database\Factories;

use App\Models\DjaProgram;
use Illuminate\Database\Eloquent\Factories\Factory;

class DjaProgramFactory extends Factory
{
    protected $model = DjaProgram::class;

    public function definition(): array
    {
        return [
            'tahun_anggaran' => now()->year,
            'kode' => fake()->unique()->numerify('###.##'),
            'nama' => fake()->sentence(3),
            'pagu' => fake()->numberBetween(1000000, 10000000),
            'is_aktif' => true,
        ];
    }
}
