<?php

namespace Database\Factories;

use App\Models\DjaKro;
use Illuminate\Database\Eloquent\Factories\Factory;

class DjaKroFactory extends Factory
{
    protected $model = DjaKro::class;

    public function definition(): array
    {
        return [
            'sasaran_id' => null,
            'kode' => fake()->unique()->numerify('###.##'),
            'nama' => fake()->sentence(3),
        ];
    }
}
