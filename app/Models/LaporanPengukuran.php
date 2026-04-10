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
        'peer_tim_kerja_id',
        'status',
        'submitted_at',
        'submitted_by',
        'rekomendasi_kabag',
        'approved_at',
        'approved_by',
        'created_by',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'approved_at'  => 'datetime',
    ];

    public function timKerja(): BelongsTo
    {
        return $this->belongsTo(TimKerja::class);
    }

    /** Tim kolaborator (partner) untuk laporan ini. Null = laporan solo. */
    public function peerTimKerja(): BelongsTo
    {
        return $this->belongsTo(TimKerja::class, 'peer_tim_kerja_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(PeriodePengukuran::class, 'periode_pengukuran_id');
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isKabagApproved(): bool
    {
        return $this->status === 'kabag_approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }
}
