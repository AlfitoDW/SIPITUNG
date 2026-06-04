<?php

namespace Database\Factories;

use App\Models\RefNama;
use Illuminate\Database\Eloquent\Factories\Factory;

class RefNamaFactory extends Factory
{
    protected $model = RefNama::class;

    public function definition(): array
    {
        return [
            'nama' => fake()->name(),
            'nip' => fake()->optional()->numerify('##########'),
            'nik' => fake()->optional()->numerify('################'),
            'npwp' => fake()->optional()->numerify('##.###.###.#-###.###'),
            'gol_ruang' => fake()->randomElement(['III/a', 'III/b', 'III/c', 'IV/a', 'IV/b']),
            'status_kepegawaian' => 'PNS',
            'nama_rekening' => fake()->name(),
            'no_rekening' => fake()->bankAccountNumber(),
            'nama_bank' => fake()->randomElement(['BNI', 'BRI', 'Mandiri', 'BCA']),
            'email' => fake()->optional()->safeEmail(),
            'pph21_persen' => 5.0,
            'is_aktif' => true,
        ];
    }

    public function nonPns(): static
    {
        return $this->state(fn () => [
            'status_kepegawaian' => 'Non-PNS',
            'gol_ruang' => 'Non PNS',
            'nip' => null,
        ]);
    }
}
