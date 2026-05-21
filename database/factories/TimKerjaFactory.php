<?php

namespace Database\Factories;

use App\Models\TimKerja;
use Illuminate\Database\Eloquent\Factories\Factory;

class TimKerjaFactory extends Factory
{
    protected $model = TimKerja::class;

    public function definition(): array
    {
        $kode = fake()->unique()->regexify('[A-Z]{2,4}');

        return [
            'nama' => fake()->company(),
            'kode' => $kode,
            'nama_singkat' => $kode,
            'deskripsi' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
