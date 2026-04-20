<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RencanaAksiIndikator extends Model
{
    protected $table = 'rencana_aksi_indikator';

    protected $fillable = [
        'rencana_aksi_id',
        'sasaran_id',
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

    public function sasaran(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Sasaran::class, 'sasaran_id');
    }

    public function kegiatans(): HasMany
    {
        return $this->hasMany(RencanaKegiatan::class, 'rencana_aksi_indikator_id')
            ->orderBy('triwulan')
            ->orderBy('urutan');
    }
}
