<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sasaran extends Model
{
    protected $table = 'sasaran';

    protected $fillable = [
        'perjanjian_kinerja_id',
        'kode',
        'nama',
        'urutan',
    ];

    public function perjanjianKinerja(): BelongsTo
    {
        return $this->belongsTo(PerjanjianKinerja::class, 'perjanjian_kinerja_id');
    }

    public function indikators(): HasMany
    {
        return $this->hasMany(IndikatorKinerja::class)->orderBy('urutan');
    }
}
