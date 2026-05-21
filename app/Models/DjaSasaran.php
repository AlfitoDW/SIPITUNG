<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DjaSasaran extends Model
{
    use HasFactory;
    protected $table = 'dja_sasaran';

    protected $fillable = ['program_id', 'kode', 'nama', 'pagu', 'is_aktif'];

    protected $casts = ['is_aktif' => 'boolean', 'pagu' => 'integer'];

    public function program(): BelongsTo
    {
        return $this->belongsTo(DjaProgram::class, 'program_id');
    }

    public function kros(): HasMany
    {
        return $this->hasMany(DjaKro::class, 'sasaran_id');
    }
}
