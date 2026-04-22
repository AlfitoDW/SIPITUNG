<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PermohonanDanaItem extends Model
{
    protected $table = 'permohonan_dana_item';

    protected $fillable = [
        'permohonan_dana_id',
        'uraian',
        'volume',
        'satuan',
        'harga_satuan',
        'total',
        'keterangan',
        'urutan',
    ];

    protected $casts = [
        'volume' => 'decimal:2',
        'harga_satuan' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function permohonanDana(): BelongsTo
    {
        return $this->belongsTo(PermohonanDana::class, 'permohonan_dana_id');
    }
}
