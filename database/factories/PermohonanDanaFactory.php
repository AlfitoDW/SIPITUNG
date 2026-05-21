<?php

namespace Database\Factories;

use App\Models\PermohonanDana;
use App\Models\TahunAnggaran;
use App\Models\TimKerja;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PermohonanDanaFactory extends Factory
{
    protected $model = PermohonanDana::class;

    public function definition(): array
    {
        $tahunAnggaran = TahunAnggaran::factory();
        $timKerja = TimKerja::factory();
        $pumk = User::factory()->pumk();

        return [
            'tahun_anggaran_id' => $tahunAnggaran,
            'tim_kerja_id' => $timKerja,
            'judul_pekerjaan' => fake()->sentence(4),
            'nomor_permohonan' => fn (array $attributes) => PermohonanDana::generateNomor(
                $attributes['tahun_anggaran_id'],
                TahunAnggaran::find($attributes['tahun_anggaran_id'])->tahun
            ),
            'keperluan' => fake()->paragraph(),
            'tanggal_mulai' => now()->addDays(3),
            'tanggal_selesai' => now()->addDays(5),
            'jam_pelaksanaan' => '09:00',
            'kapokja_id' => User::factory()->ketuaTim(),
            'pic_keuangan_id' => User::factory()->picKeuangan(),
            'tempat' => fake()->city(),
            'total_anggaran' => 0,
            'status' => 'draft',
            'wizard_step' => 1,
            'created_by' => $pumk,
        ];
    }

    // ─── Status States ───────────────────────────────────────────────────────────

    public function draft(): static
    {
        return $this->state(['status' => 'draft', 'wizard_step' => 1]);
    }

    public function submitted(): static
    {
        return $this->state([
            'status' => 'submitted',
            'wizard_step' => 4,
            'submitted_at' => now(),
        ]);
    }

    public function katimApproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'katim_approved',
            'wizard_step' => 4,
            'submitted_at' => now()->subDay(),
            'katim_approved_by' => User::factory()->ketuaTim(),
            'katim_approved_at' => now(),
        ]);
    }

    public function kabagApproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'kabag_approved',
            'wizard_step' => 4,
            'submitted_at' => now()->subDays(2),
            'katim_approved_by' => User::factory()->ketuaTim(),
            'katim_approved_at' => now()->subDay(),
            'kabag_approved_by' => User::factory()->kabag(),
            'kabag_approved_at' => now(),
        ]);
    }

    public function ppkApproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'ppk_approved',
            'wizard_step' => 4,
            'submitted_at' => now()->subDays(3),
            'katim_approved_by' => User::factory()->ketuaTim(),
            'katim_approved_at' => now()->subDays(2),
            'kabag_approved_by' => User::factory()->kabag(),
            'kabag_approved_at' => now()->subDay(),
            'ppk_approved_by' => User::factory()->ppk(),
            'ppk_approved_at' => now(),
        ]);
    }

    public function picApproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pic_approved',
            'wizard_step' => 4,
            'submitted_at' => now()->subDays(4),
            'katim_approved_by' => User::factory()->ketuaTim(),
            'katim_approved_at' => now()->subDays(3),
            'kabag_approved_by' => User::factory()->kabag(),
            'kabag_approved_at' => now()->subDays(2),
            'ppk_approved_by' => User::factory()->ppk(),
            'ppk_approved_at' => now()->subDay(),
            'pic_approved_by' => User::factory()->picKeuangan(),
            'pic_approved_at' => now(),
        ]);
    }

    public function dicairkan(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'dicairkan',
            'wizard_step' => 4,
            'submitted_at' => now()->subDays(5),
            'katim_approved_by' => User::factory()->ketuaTim(),
            'katim_approved_at' => now()->subDays(4),
            'kabag_approved_by' => User::factory()->kabag(),
            'kabag_approved_at' => now()->subDays(3),
            'ppk_approved_by' => User::factory()->ppk(),
            'ppk_approved_at' => now()->subDays(2),
            'pic_approved_by' => User::factory()->picKeuangan(),
            'pic_approved_at' => now()->subDay(),
            'dicairkan_by' => User::factory()->bendahara(),
            'dicairkan_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'wizard_step' => 4,
            'submitted_at' => now()->subDay(),
            'rejected_at_step' => 'katim',
            'rejected_at' => now(),
            'catatan_penolakan' => fake()->sentence(),
        ]);
    }
}
