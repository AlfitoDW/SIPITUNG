<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RencanaAksiIndikator extends Model
{
    protected $table = 'rencana_aksi_indikator';

    protected $fillable = [
        'rencana_aksi_id',
        'kode',
        'nama',
        'satuan',
        'target',
        'target_tw1',
        'target_tw2',
        'target_tw3',
        'target_tw4',
        'urutan',
    ];

    public function rencanaAksi(): BelongsTo
    {
        return $this->belongsTo(RencanaAksi::class, 'rencana_aksi_id');
    }
}
