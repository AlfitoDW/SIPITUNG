<?php

namespace Database\Factories;

use App\Models\DjaSasaran;
use Illuminate\Database\Eloquent\Factories\Factory;

class DjaSasaranFactory extends Factory
{
    protected $model = DjaSasaran::class;

    public function definition(): array
    {
        return [
            'program_id' => null,
            'kode' => fake()->unique()->numerify('###.##'),
            'nama' => fake()->sentence(3),
        ];
    }
}
