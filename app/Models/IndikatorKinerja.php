<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IndikatorKinerja extends Model
{
    protected $table = 'indikator_kinerja';

    protected $fillable = [
        'sasaran_id',
        'kode',
        'nama',
        'satuan',
        'target',
        'urutan',
    ];

    public function sasaran(): BelongsTo
    {
        return $this->belongsTo(Sasaran::class);
    }
}
