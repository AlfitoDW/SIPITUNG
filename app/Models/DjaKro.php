<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DjaKro extends Model
{
    protected $table = 'dja_kro';
    protected $fillable = ['sasaran_id', 'kode', 'nama', 'pagu', 'is_aktif'];
    protected $casts = ['is_aktif' => 'boolean', 'pagu' => 'integer'];

    public function sasaran(): BelongsTo { return $this->belongsTo(DjaSasaran::class, 'sasaran_id'); }
    public function ros(): HasMany       { return $this->hasMany(DjaRo::class, 'kro_id'); }
}
