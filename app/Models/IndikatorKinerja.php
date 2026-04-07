<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IndikatorKinerja extends Model
{
    protected $table = 'indikator_kinerja';

    protected $fillable = [
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
        'pic_tim_kerja_id',
    ];

    public function sasaran(): BelongsTo
    {
        return $this->belongsTo(Sasaran::class);
    }

    public function picTimKerja(): BelongsTo
    {
        return $this->belongsTo(TimKerja::class, 'pic_tim_kerja_id');
    }

    /** Semua PIC (termasuk co-PIC) via pivot table */
    public function picTimKerjas(): BelongsToMany
    {
        return $this->belongsToMany(TimKerja::class, 'indikator_kinerja_pic');
    }

    public function realisasis(): HasMany
    {
        return $this->hasMany(RealisasiKinerja::class);
    }
}
