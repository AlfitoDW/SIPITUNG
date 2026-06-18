<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DjaRo extends Model
{
    use HasFactory;

    protected $table = 'dja_ro';

    protected $fillable = ['kro_id', 'kode', 'nama', 'volume', 'satuan', 'pagu', 'is_aktif'];

    protected $casts = ['is_aktif' => 'boolean', 'pagu' => 'integer'];

    public function kro(): BelongsTo
    {
        return $this->belongsTo(DjaKro::class, 'kro_id');
    }

    public function komponens(): HasMany
    {
        return $this->hasMany(DjaKomponen::class, 'ro_id');
    }
}
