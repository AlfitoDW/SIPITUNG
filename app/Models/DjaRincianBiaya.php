<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DjaRincianBiaya extends Model
{
    use HasFactory;
    protected $table = 'dja_rincian_biaya';

    protected $fillable = [
        'kegiatan_id', 'kode_akun', 'nama_akun', 'nama_item',
        'volume_default', 'satuan', 'harga_satuan', 'pagu_total', 'urutan', 'is_aktif',
    ];

    protected $casts = [
        'is_aktif' => 'boolean',
        'harga_satuan' => 'decimal:2',
        'pagu_total' => 'decimal:2',
    ];

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(DjaKegiatan::class, 'kegiatan_id');
    }

    /** Hitung total sudah terpakai dari permohonan yang approved (katim ke atas) */
    public function getTerpakaiAttribute(): float
    {
        $cacheKey = "dja_rincian_{$this->id}_terpakai";

        return cache()->remember($cacheKey, now()->addMinute(), function () {
            return (float) PermohonanDanaItem::where('dja_rincian_biaya_id', $this->id)
                ->whereHas('permohonanDana', fn ($q) => $q->whereNotIn('status', ['draft', 'rejected']))
                ->sum('jumlah_permintaan');
        });
    }

    public function getSisaAnggaranAttribute(): float
    {
        return max(0, (float) $this->pagu_total - $this->terpakai);
    }
}
