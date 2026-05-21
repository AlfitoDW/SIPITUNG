<?php

namespace Database\Factories;

use App\Models\TahunAnggaran;
use Illuminate\Database\Eloquent\Factories\Factory;

class TahunAnggaranFactory extends Factory
{
    protected $model = TahunAnggaran::class;

    public function definition(): array
    {
        $tahun = fake()->unique()->numberBetween(2020, 2030);

        return [
            'tahun' => $tahun,
            'label' => "TA {$tahun}",
            'is_active' => true,
            'is_default' => false,
            'batas_pengisian_ra' => null,
        ];
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }
}
