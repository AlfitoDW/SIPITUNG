<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama_lengkap' => fake()->name(),
            'nip' => null,
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'super_admin',
            'is_active' => true,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }

    // ─── Role States ─────────────────────────────────────────────────────────────

    public function superAdmin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'super_admin',
            'username' => fake()->unique()->userName(),
        ]);
    }

    public function pumk(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'pumk',
            'username' => fake()->unique()->userName(),
        ]);
    }

    public function ketuaTim(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'ketua_tim_kerja',
            'username' => fake()->unique()->userName(),
        ]);
    }

    public function kabag(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'pimpinan',
            'pimpinan_type' => 'kabag_umum',
            'username' => fake()->unique()->userName(),
        ]);
    }

    public function ppk(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'pimpinan',
            'pimpinan_type' => 'ppk',
            'username' => fake()->unique()->userName(),
        ]);
    }

    public function picKeuangan(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'pic_keuangan',
            'username' => fake()->unique()->userName(),
        ]);
    }

    public function bendahara(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'bendahara',
            'username' => fake()->unique()->userName(),
        ]);
    }
}
