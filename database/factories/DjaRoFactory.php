<?php

namespace Database\Factories;

use App\Models\DjaRo;
use Illuminate\Database\Eloquent\Factories\Factory;

class DjaRoFactory extends Factory
{
    protected $model = DjaRo::class;

    public function definition(): array
    {
        return [
            'kro_id' => null,
            'kode' => fake()->unique()->numerify('###.##'),
            'nama' => fake()->sentence(3),
        ];
    }
}
