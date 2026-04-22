<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PeriodePengukuran extends Model
{
    protected $table = 'periode_pengukuran';

    protected $fillable = [
        'tahun_anggaran_id',
        'triwulan',
        'tanggal_mulai',
        'tanggal_selesai',
        'is_active',
        'rekomendasi_pimpinan',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
        ];
    }

    public function tahunAnggaran(): BelongsTo
    {
        return $this->belongsTo(TahunAnggaran::class);
    }

    public function realisasis(): HasMany
    {
        return $this->hasMany(RealisasiKinerja::class);
    }

    public function laporans(): HasMany
    {
        return $this->hasMany(LaporanPengukuran::class);
    }
}
