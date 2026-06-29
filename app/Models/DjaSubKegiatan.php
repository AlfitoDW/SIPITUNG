<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DjaSubKegiatan extends Model
{
    use HasFactory;

    protected $table = 'dja_sub_kegiatan';

    protected $fillable = [
        'kegiatan_id',
        'kode_akun',
        'nama_akun',
        'pagu',
        'urutan',
        'is_aktif',
    ];

    protected $casts = [
        'is_aktif' => 'boolean',
        'pagu' => 'integer',
    ];

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(DjaKegiatan::class, 'kegiatan_id');
    }

    public function rincianBiayas(): HasMany
    {
        return $this->hasMany(DjaRincianBiaya::class, 'sub_kegiatan_id');
    }
}
