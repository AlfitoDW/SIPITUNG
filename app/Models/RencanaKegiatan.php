<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RencanaKegiatan extends Model
{
    protected $table = 'rencana_kegiatan';

    protected $fillable = [
        'rencana_aksi_indikator_id',
        'triwulan',
        'urutan',
        'nama_kegiatan',
    ];

    public function indikator(): BelongsTo
    {
        return $this->belongsTo(RencanaAksiIndikator::class, 'rencana_aksi_indikator_id');
    }
}
