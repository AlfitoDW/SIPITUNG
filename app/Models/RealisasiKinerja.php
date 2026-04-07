<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RealisasiKinerja extends Model
{
    protected $table = 'realisasi_kinerja';

    protected $fillable = [
        'indikator_kinerja_id',
        'periode_pengukuran_id',
        'input_by_tim_kerja_id',
        'realisasi',
        'progress_kegiatan',
        'kendala',
        'strategi_tindak_lanjut',
        'catatan',
        'created_by',
    ];

    public function indikatorKinerja(): BelongsTo
    {
        return $this->belongsTo(IndikatorKinerja::class);
    }

    public function periodePengukuran(): BelongsTo
    {
        return $this->belongsTo(PeriodePengukuran::class);
    }

    /** Tim kerja yang pertama kali mengisi (mengunci bagi PIC lain) */
    public function inputByTimKerja(): BelongsTo
    {
        return $this->belongsTo(TimKerja::class, 'input_by_tim_kerja_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
