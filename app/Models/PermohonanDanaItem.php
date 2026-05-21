<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PermohonanDanaItem extends Model
{
    protected $table = 'permohonan_dana_item';

    protected $fillable = [
        'permohonan_dana_id',
        'dja_rincian_biaya_id',
        'kode_akun',
        'uraian',
        'volume',
        'satuan',
        'harga_satuan',
        'total',
        'jumlah_permintaan',
        'keterangan',
        'tipe_nominatif',
        'urutan',
    ];

    protected $casts = [
        'volume' => 'decimal:2',
        'harga_satuan' => 'decimal:2',
        'total' => 'decimal:2',
        'jumlah_permintaan' => 'decimal:2',
    ];

    // ─── Kode akun honor & perjadin ───────────────────────────────────────────

    const HONOR_AKUN = ['521115', '521213', '522151'];

    const PERJADIN_AKUN = ['524111', '524119', '524113', '524114'];

    public function isHonor(): bool
    {
        return in_array($this->kode_akun, self::HONOR_AKUN);
    }

    public function isPerjadin(): bool
    {
        return in_array($this->kode_akun, self::PERJADIN_AKUN);
    }

    // ─── Auto-set tipe_nominatif saat save ────────────────────────────────────

    protected static function boot(): void
    {
        parent::boot();

        static::saving(function (self $item) {
            if (in_array($item->kode_akun, self::HONOR_AKUN)) {
                $item->tipe_nominatif = 'honor';
            } elseif (in_array($item->kode_akun, self::PERJADIN_AKUN)) {
                $item->tipe_nominatif = 'perjadin';
            } else {
                $item->tipe_nominatif = 'non_nominatif';
            }
        });
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function permohonanDana(): BelongsTo
    {
        return $this->belongsTo(PermohonanDana::class, 'permohonan_dana_id');
    }

    public function djaRincianBiaya(): BelongsTo
    {
        return $this->belongsTo(DjaRincianBiaya::class, 'dja_rincian_biaya_id');
    }

    public function nominatif(): HasMany
    {
        return $this->hasMany(PermohonanDanaItemNominatif::class, 'permohonan_dana_item_id')
            ->orderBy('urutan');
    }
}
