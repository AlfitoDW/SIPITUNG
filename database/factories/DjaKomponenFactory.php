<?php

namespace Database\Factories;

use App\Models\DjaKomponen;
use Illuminate\Database\Eloquent\Factories\Factory;

class DjaKomponenFactory extends Factory
{
    protected $model = DjaKomponen::class;

    public function definition(): array
    {
        return [
            'ro_id' => null,
            'kode' => fake()->unique()->numerify('###.##'),
            'nama' => fake()->sentence(3),
        ];
    }
}
