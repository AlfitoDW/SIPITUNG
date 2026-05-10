<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DjaKomponen extends Model
{
    protected $table = 'dja_komponen';

    protected $fillable = ['ro_id', 'kode', 'nama', 'jenis', 'pagu', 'is_aktif'];

    protected $casts = ['is_aktif' => 'boolean', 'pagu' => 'integer'];

    public function ro(): BelongsTo
    {
        return $this->belongsTo(DjaRo::class, 'ro_id');
    }

    public function kegiatans(): HasMany
    {
        return $this->hasMany(DjaKegiatan::class, 'komponen_id');
    }
}
