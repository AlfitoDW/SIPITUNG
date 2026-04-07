<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('indikator_kinerja_pic');
        Schema::create('indikator_kinerja_pic', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('indikator_kinerja_id');
            $table->foreign('indikator_kinerja_id', 'iku_pic_iku_fk')->references('id')->on('indikator_kinerja')->cascadeOnDelete();
            $table->unsignedBigInteger('tim_kerja_id');
            $table->foreign('tim_kerja_id', 'iku_pic_tk_fk')->references('id')->on('tim_kerja')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['indikator_kinerja_id', 'tim_kerja_id'], 'iku_pic_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indikator_kinerja_pic');
    }
};
