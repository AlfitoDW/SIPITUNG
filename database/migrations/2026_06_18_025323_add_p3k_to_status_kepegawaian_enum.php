<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE ref_nama MODIFY COLUMN status_kepegawaian ENUM('PNS', 'Non-PNS', 'P3K') NOT NULL DEFAULT 'PNS'");
        } else {
            // SQLite: recreate table to remove CHECK constraint
            Schema::create('ref_nama_new', function ($table) {
                $table->id();
                $table->string('nama', 150);
                $table->string('nip', 30)->nullable()->unique();
                $table->string('nik', 20)->nullable();
                $table->string('npwp', 20)->nullable();
                $table->string('gol_ruang', 10)->nullable();
                $table->string('status_kepegawaian')->default('PNS');
                $table->string('nama_rekening', 150)->nullable();
                $table->string('no_rekening', 30)->nullable();
                $table->string('nama_bank', 100)->nullable();
                $table->string('email', 150)->nullable();
                $table->decimal('pph21_persen', 5, 2)->default(0);
                $table->boolean('is_aktif')->default(true);
                $table->timestamps();
            });

            DB::statement('INSERT INTO ref_nama_new SELECT * FROM ref_nama');
            Schema::drop('ref_nama');
            Schema::rename('ref_nama_new', 'ref_nama');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE ref_nama MODIFY COLUMN status_kepegawaian ENUM('PNS', 'Non-PNS') NOT NULL DEFAULT 'PNS'");
        } else {
            Schema::create('ref_nama_old', function ($table) {
                $table->id();
                $table->string('nama', 150);
                $table->string('nip', 30)->nullable()->unique();
                $table->string('nik', 20)->nullable();
                $table->string('npwp', 20)->nullable();
                $table->string('gol_ruang', 10)->nullable();
                $table->string('status_kepegawaian')->default('PNS');
                $table->string('nama_rekening', 150)->nullable();
                $table->string('no_rekening', 30)->nullable();
                $table->string('nama_bank', 100)->nullable();
                $table->string('email', 150)->nullable();
                $table->decimal('pph21_persen', 5, 2)->default(0);
                $table->boolean('is_aktif')->default(true);
                $table->timestamps();
            });

            DB::statement("INSERT INTO ref_nama_old SELECT * FROM ref_nama WHERE status_kepegawaian IN ('PNS', 'Non-PNS')");
            Schema::drop('ref_nama');
            Schema::rename('ref_nama_old', 'ref_nama');
        }
    }
};
