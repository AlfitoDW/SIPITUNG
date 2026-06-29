<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class DjaKegiatan extends Model
{
    use HasFactory;

    protected $table = 'dja_kegiatan';

    protected $fillable = ['komponen_id', 'kode', 'nama', 'pagu', 'is_aktif'];

    protected $casts = ['is_aktif' => 'boolean', 'pagu' => 'integer'];

    public function komponen(): BelongsTo
    {
        return $this->belongsTo(DjaKomponen::class, 'komponen_id');
    }

    public function subKegiatans(): HasMany
    {
        return $this->hasMany(DjaSubKegiatan::class, 'kegiatan_id');
    }

    public function rincianBiayas(): HasManyThrough
    {
        return $this->hasManyThrough(DjaRincianBiaya::class, DjaSubKegiatan::class, 'kegiatan_id', 'sub_kegiatan_id');
    }
}
