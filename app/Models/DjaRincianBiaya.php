<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DjaRincianBiaya extends Model
{
    protected $table = 'dja_rincian_biaya';

    protected $fillable = [
        'kegiatan_id', 'kode_akun', 'nama_akun', 'nama_item',
        'volume_default', 'satuan', 'harga_satuan', 'pagu_total', 'urutan', 'is_aktif',
    ];

    protected $casts = [
        'is_aktif' => 'boolean',
        'harga_satuan' => 'integer',
        'pagu_total' => 'integer',
    ];

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(DjaKegiatan::class, 'kegiatan_id');
    }

    /** Hitung total sudah terpakai dari permohonan yang approved (katim ke atas) */
    public function getTerpakaiAttribute(): int
    {
        return PermohonanDanaItem::where('dja_rincian_biaya_id', $this->id)
            ->whereHas('permohonanDana', fn ($q) => $q->whereNotIn('status', ['draft', 'rejected']))
            ->sum('jumlah_permintaan');
    }

    public function getSisaAnggaranAttribute(): int
    {
        return max(0, $this->pagu_total - $this->terpakai);
    }
}
