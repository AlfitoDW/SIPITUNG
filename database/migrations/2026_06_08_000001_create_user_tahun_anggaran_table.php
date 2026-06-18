<?php

use App\Models\TahunAnggaran;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_tahun_anggaran', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('tahun_anggaran_id')->constrained('tahun_anggaran')->cascadeOnDelete();
            $table->foreignId('tim_kerja_id')->nullable()->constrained('tim_kerja')->nullOnDelete();
            $table->string('role', 30)->nullable();
            $table->string('pimpinan_type', 30)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'tahun_anggaran_id']);
            $table->index(['tahun_anggaran_id', 'role']);
            $table->index(['tahun_anggaran_id', 'tim_kerja_id']);
        });

        // Seed: copy semua existing user (kecuali super_admin) ke tahun default
        $defaultTahun = TahunAnggaran::where('is_default', true)->first()
            ?? TahunAnggaran::orderBy('tahun', 'desc')->first();

        if ($defaultTahun) {
            $users = User::where('role', '!=', 'super_admin')->get();
            $rows = $users->map(fn ($user) => [
                'user_id' => $user->id,
                'tahun_anggaran_id' => $defaultTahun->id,
                'tim_kerja_id' => $user->tim_kerja_id,
                'role' => $user->role,
                'pimpinan_type' => $user->pimpinan_type,
                'is_active' => $user->is_active,
                'created_at' => now(),
                'updated_at' => now(),
            ])->toArray();

            if (count($rows) > 0) {
                DB::table('user_tahun_anggaran')->insert($rows);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_tahun_anggaran');
    }
};
