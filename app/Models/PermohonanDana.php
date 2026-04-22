<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PermohonanDana extends Model
{
    protected $table = 'permohonan_dana';

    protected $fillable = [
        'tahun_anggaran_id',
        'tim_kerja_id',
        'nomor_permohonan',
        'keperluan',
        'tanggal_kegiatan',
        'keterangan',
        'total_anggaran',
        'status',
        'kabag_approved_by',
        'rekomendasi_kabag',
        'bendahara_checked_by',
        'catatan_bendahara',
        'katimku_approved_by',
        'rekomendasi_katimku',
        'ppk_approved_by',
        'rekomendasi_ppk',
        'dicairkan_by',
        'catatan_pencairan',
        'dicairkan_at',
        'rejected_by',
        'created_by',
    ];

    protected $casts = [
        'tanggal_kegiatan' => 'date',
        'total_anggaran' => 'decimal:2',
        'dicairkan_at' => 'datetime',
        'status' => 'string',
    ];

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isSubmitted(): bool
    {
        return $this->status === 'submitted';
    }

    public function isKabagApproved(): bool
    {
        return $this->status === 'kabag_approved';
    }

    public function isBendaharaChecked(): bool
    {
        return $this->status === 'bendahara_checked';
    }

    public function isKatimkuApproved(): bool
    {
        return $this->status === 'katimku_approved';
    }

    public function isPpkApproved(): bool
    {
        return $this->status === 'ppk_approved';
    }

    public function isDicairkan(): bool
    {
        return $this->status === 'dicairkan';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isEditable(): bool
    {
        return in_array($this->status, ['draft', 'rejected']);
    }

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

    public function items(): HasMany
    {
        return $this->hasMany(PermohonanDanaItem::class)->orderBy('urutan');
    }
}
