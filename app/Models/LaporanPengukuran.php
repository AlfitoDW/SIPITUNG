<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaporanPengukuran extends Model
{
    protected $table = 'laporan_pengukuran';

    protected $fillable = [
        'tim_kerja_id',
        'periode_pengukuran_id',
        'status',
        'submitted_at',
        'submitted_by',
        'created_by',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function timKerja(): BelongsTo
    {
        return $this->belongsTo(TimKerja::class);
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(PeriodePengukuran::class, 'periode_pengukuran_id');
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }
}
