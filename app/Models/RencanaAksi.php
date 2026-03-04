<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RencanaAksi extends Model
{
    protected $table = 'rencana_aksi';

    protected $fillable = [
        'tahun_anggaran_id',
        'tim_kerja_id',
        'status',
        'created_by',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    public function isDraft(): bool     { return $this->status === 'draft'; }
    public function isSubmitted(): bool { return $this->status === 'submitted'; }
    public function isApproved(): bool  { return $this->status === 'approved'; }
    public function isRejected(): bool  { return $this->status === 'rejected'; }
    public function isEditable(): bool  { return in_array($this->status, ['draft', 'rejected']); }

    public function tahunAnggaran(): BelongsTo
    {
        return $this->belongsTo(TahunAnggaran::class, 'tahun_anggaran_id');
    }

    public function timKerja(): BelongsTo
    {
        return $this->belongsTo(TimKerja::class, 'tim_kerja_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function indikators(): HasMany
    {
        return $this->hasMany(RencanaAksiIndikator::class)->orderBy('urutan');
    }
}
